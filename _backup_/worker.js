/**
 * Agrupamento 676 Cristo-Rei
 * 676 CMS API
 * Version: 1.3.1
 */

const API_VERSION = "1.3.1";
const SERVICE_NAME = "676 CMS API";
const ALLOWED_ORIGIN = "https://adrvalente.github.io";

const PBKDF2_ITERATIONS = 100000;

const SESSION_COOKIE = "676_session";
const SESSION_TTL = 60 * 60 * 8; // 8 horas


export default {

  async fetch(request, env) {

    const url = new URL(request.url);
    const origin = request.headers.get("Origin");


    // =====================================================
    // CORS
    // =====================================================

    const corsHeaders = {

      "Access-Control-Allow-Methods":
        "GET, POST, OPTIONS",

      "Access-Control-Allow-Headers":
        "Content-Type",

      "Access-Control-Allow-Credentials":
        "true",

      "Vary":
        "Origin"
    };


    if (origin === ALLOWED_ORIGIN) {

      corsHeaders[
        "Access-Control-Allow-Origin"
      ] = origin;

    }


    // =====================================================
    // OPTIONS
    // =====================================================

    if (request.method === "OPTIONS") {

      if (origin !== ALLOWED_ORIGIN) {

        return new Response(
          null,
          {
            status: 403
          }
        );

      }


      return new Response(
        null,
        {
          status: 204,
          headers: corsHeaders
        }
      );

    }



    // =====================================================
    // GET /
    // =====================================================

    if (
      url.pathname === "/" &&
      request.method === "GET"
    ) {

      return jsonResponse(
        {
          service: SERVICE_NAME,
          version: API_VERSION,
          status: "online",
          project:
            "Agrupamento 676 Cristo-Rei",
          environment:
            "production"
        },
        200,
        corsHeaders
      );

    }



    // =====================================================
    // GET /api/health
    // =====================================================

    if (
      url.pathname === "/api/health" &&
      request.method === "GET"
    ) {

      return jsonResponse(
        {
          status: "ok",
          service: SERVICE_NAME,
          version: API_VERSION,
          timestamp:
            new Date().toISOString()
        },
        200,
        corsHeaders
      );

    }



    // =====================================================
    // GET /api
    // =====================================================

    if (
      url.pathname === "/api" &&
      request.method === "GET"
    ) {

      return jsonResponse(
        {

          service: SERVICE_NAME,

          version: API_VERSION,

          endpoints: {

            health:
              "GET /api/health",

            login:
              "POST /api/auth/login",

            session:
              "GET /api/auth/session",

            logout:
              "POST /api/auth/logout",

            publish:
              "POST /api/publish"

          }

        },
        200,
        corsHeaders
      );

    }



    // =====================================================
    // POST /api/auth/login
    // =====================================================

    if (
      url.pathname === "/api/auth/login" &&
      request.method === "POST"
    ) {

      try {

        const body =
          await request.json();


        const username =
          String(
            body.username || ""
          ).trim();


        const password =
          String(
            body.password || ""
          );


        if (
          !username ||
          !password
        ) {

          return jsonResponse(
            {
              ok: false,
              error:
                "Credenciais inválidas."
            },
            401,
            corsHeaders
          );

        }


        const usernameOK =
          timingSafeEqualStrings(
            username,
            env.ADMIN_USERNAME
          );


        const passwordOK =
          await verifyPassword(
            password,
            env.ADMIN_PASSWORD_SALT,
            env.ADMIN_PASSWORD_HASH
          );


        if (
          !usernameOK ||
          !passwordOK
        ) {

          return jsonResponse(
            {
              ok: false,
              error:
                "Credenciais inválidas."
            },
            401,
            corsHeaders
          );

        }


        // Criar identificador aleatório

        const sessionId =
          randomToken(32);


        const now =
          Date.now();


        const session = {

          username:
            env.ADMIN_USERNAME,

          role:
            "admin",

          createdAt:
            new Date(now)
              .toISOString(),

          expiresAt:
            new Date(
              now +
              SESSION_TTL * 1000
            ).toISOString()

        };


        // O ID guardado no browser não é
        // usado diretamente como chave KV.

        const kvKey =
          "session:" +
          await signSessionId(
            sessionId,
            env.SESSION_SECRET
          );


        await env.SESSIONS.put(
          kvKey,
          JSON.stringify(session),
          {
            expirationTtl:
              SESSION_TTL
          }
        );


        const headers =
          new Headers(
            corsHeaders
          );


        headers.append(
          "Set-Cookie",
          makeSessionCookie(
            sessionId
          )
        );


        return jsonResponse(
          {

            ok: true,

            user: {

              username:
                session.username,

              role:
                session.role

            }

          },
          200,
          headers
        );


      } catch (error) {

        console.error(
          "Login error:",
          error
        );


        return jsonResponse(
          {
            ok: false,
            error:
              "Não foi possível iniciar sessão."
          },
          500,
          corsHeaders
        );

      }

    }



    // =====================================================
    // GET /api/auth/session
    // =====================================================

    if (
      url.pathname === "/api/auth/session" &&
      request.method === "GET"
    ) {

      const session =
        await getSession(
          request,
          env
        );


      if (!session) {

        return jsonResponse(
          {
            authenticated:
              false
          },
          401,
          corsHeaders
        );

      }


      return jsonResponse(
        {

          authenticated:
            true,

          user: {

            username:
              session.username,

            role:
              session.role

          },

          expiresAt:
            session.expiresAt

        },
        200,
        corsHeaders
      );

    }



    // =====================================================
    // POST /api/auth/logout
    // =====================================================

    if (
      url.pathname === "/api/auth/logout" &&
      request.method === "POST"
    ) {

      const sessionId =
        getCookie(
          request,
          SESSION_COOKIE
        );


      if (sessionId) {

        const kvKey =
          "session:" +
          await signSessionId(
            sessionId,
            env.SESSION_SECRET
          );


        await env.SESSIONS.delete(
          kvKey
        );

      }


      const headers =
        new Headers(
          corsHeaders
        );


      headers.append(

        "Set-Cookie",

        `${SESSION_COOKIE}=; ` +
        `Path=/; ` +
        `HttpOnly; ` +
        `Secure; ` +
        `SameSite=None; ` +
        `Max-Age=0`

      );


      return jsonResponse(
        {
          ok: true
        },
        200,
        headers
      );

    }



    // =====================================================
    // POST /api/publish
    // =====================================================

    if (
      url.pathname === "/api/publish" &&
      request.method === "POST"
    ) {

      // ---------------------------------------------------
      // Segurança: apenas o GitHub Pages do projeto
      // ---------------------------------------------------

      if (
        origin !== ALLOWED_ORIGIN
      ) {

        return jsonResponse(
          {
            ok: false,
            error:
              "Origin não autorizada."
          },
          403,
          corsHeaders
        );

      }


      // ---------------------------------------------------
      // Validar sessão
      // ---------------------------------------------------

      const session =
        await getSession(
          request,
          env
        );


      if (!session) {

        return jsonResponse(
          {
            ok: false,
            error:
              "Sessão inválida ou expirada."
          },
          401,
          corsHeaders
        );

      }


      try {

        const body =
          await request.json();


        const linksData =
          normalizePublishPayload(
            body
          );


        validatePublishData(
          linksData
        );


        const result =
          await publishLinksToGitHub(
            linksData,
            env,
            session
          );


        return jsonResponse(
          {

            ok: true,

            message:
              "Links publicados com sucesso.",

            commit:
              result.commit,

            file:
              result.file,

            publishedAt:
              new Date()
                .toISOString()

          },
          200,
          corsHeaders
        );


      } catch (error) {

        console.error(
          "Publish error:",
          error
        );


        const status =
          error &&
          Number.isInteger(
            error.status
          )
            ? error.status
            : 500;


        return jsonResponse(
          {

            ok: false,

            error:
              status >= 500

                ? "Não foi possível publicar no GitHub."

                : String(
                    error.message ||
                    "Pedido de publicação inválido."
                  )

          },
          status,
          corsHeaders
        );

      }

    }



    // =====================================================
    // 404
    // =====================================================

    return jsonResponse(
      {

        error:
          "Not Found",

        message:
          "Endpoint não encontrado.",

        path:
          url.pathname

      },
      404,
      corsHeaders
    );

  }

};



// =========================================================
// SESSION
// =========================================================

async function getSession(
  request,
  env
) {

  const sessionId =
    getCookie(
      request,
      SESSION_COOKIE
    );


  if (!sessionId) {

    return null;

  }


  const kvKey =
    "session:" +
    await signSessionId(
      sessionId,
      env.SESSION_SECRET
    );


  const raw =
    await env.SESSIONS.get(
      kvKey
    );


  if (!raw) {

    return null;

  }


  try {

    const session =
      JSON.parse(raw);


    if (
      !session.expiresAt ||
      Date.parse(
        session.expiresAt
      ) <= Date.now()
    ) {

      await env.SESSIONS.delete(
        kvKey
      );

      return null;

    }


    return session;


  } catch {

    await env.SESSIONS.delete(
      kvKey
    );

    return null;

  }

}



// =========================================================
// PASSWORD — PBKDF2 SHA-256
// =========================================================

async function verifyPassword(
  password,
  saltBase64,
  expectedHashBase64
) {

  const encoder =
    new TextEncoder();


  const keyMaterial =
    await crypto.subtle.importKey(

      "raw",

      encoder.encode(
        password
      ),

      "PBKDF2",

      false,

      [
        "deriveBits"
      ]

    );


  const salt =
    base64ToBytes(
      saltBase64
    );


  const bits =
    await crypto.subtle.deriveBits(

      {

        name:
          "PBKDF2",

        hash:
          "SHA-256",

        salt,

        iterations:
          PBKDF2_ITERATIONS

      },

      keyMaterial,

      256

    );


  const actual =
    new Uint8Array(
      bits
    );


  const expected =
    base64ToBytes(
      expectedHashBase64
    );


  return timingSafeEqualBytes(
    actual,
    expected
  );

}



// =========================================================
// SESSION SIGNATURE
// =========================================================

async function signSessionId(
  sessionId,
  secret
) {

  const encoder =
    new TextEncoder();


  const key =
    await crypto.subtle.importKey(

      "raw",

      encoder.encode(
        secret
      ),

      {

        name:
          "HMAC",

        hash:
          "SHA-256"

      },

      false,

      [
        "sign"
      ]

    );


  const signature =
    await crypto.subtle.sign(

      "HMAC",

      key,

      encoder.encode(
        sessionId
      )

    );


  return bytesToHex(
    new Uint8Array(
      signature
    )
  );

}



// =========================================================
// COOKIE
// =========================================================

function makeSessionCookie(
  sessionId
) {

  return (

    `${SESSION_COOKIE}=${sessionId}; ` +

    `Path=/; ` +

    `HttpOnly; ` +

    `Secure; ` +

    `SameSite=None; ` +

    `Max-Age=${SESSION_TTL}`

  );

}



function getCookie(
  request,
  name
) {

  const cookie =
    request.headers.get(
      "Cookie"
    );


  if (!cookie) {

    return null;

  }


  const cookies =
    cookie.split(";");


  for (
    const item of cookies
  ) {

    const [
      key,
      ...valueParts
    ] =
      item
        .trim()
        .split("=");


    if (
      key === name
    ) {

      return valueParts.join("=");

    }

  }


  return null;

}



// =========================================================
// RANDOM TOKEN
// =========================================================

function randomToken(
  length = 32
) {

  const bytes =
    new Uint8Array(
      length
    );


  crypto.getRandomValues(
    bytes
  );


  return Array.from(
    bytes
  )
    .map(
      b =>
        b
          .toString(16)
          .padStart(
            2,
            "0"
          )
    )
    .join("");

}



// =========================================================
// TIMING SAFE COMPARISON
// =========================================================

function timingSafeEqualBytes(
  a,
  b
) {

  if (
    a.length !== b.length
  ) {

    return false;

  }


  let diff = 0;


  for (
    let i = 0;
    i < a.length;
    i++
  ) {

    diff |=
      a[i] ^ b[i];

  }


  return diff === 0;

}



function timingSafeEqualStrings(
  a,
  b
) {

  const encoder =
    new TextEncoder();


  return timingSafeEqualBytes(

    encoder.encode(a),

    encoder.encode(b)

  );

}



// =========================================================
// GITHUB APP — PUBLISH
// =========================================================

function normalizePublishPayload(
  body
) {

  // Aceita:
  //
  // POST { links: [...] }
  //
  // ou:
  //
  // POST {
  //   data: {
  //     links: [...]
  //   }
  // }

  if (
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    body.data &&
    typeof body.data === "object"
  ) {

    return body.data;

  }


  return body;

}



// =========================================================
// VALIDAR JSON
// =========================================================

function validatePublishData(
  data
) {

  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {

    throw httpError(
      400,
      "JSON de publicação inválido."
    );

  }


  if (
    !Array.isArray(
      data.links
    )
  ) {

    throw httpError(
      400,
      'O JSON tem de conter a propriedade "links".'
    );

  }


  if (
    data.links.length > 200
  ) {

    throw httpError(
      400,
      "Número de links acima do limite permitido."
    );

  }


  const serialized =
    JSON.stringify(
      data
    );


  if (
    serialized.length >
    512 * 1024
  ) {

    throw httpError(
      413,
      "O ficheiro JSON é demasiado grande."
    );

  }


  for (
    const item of data.links
  ) {

    if (
      !item ||
      typeof item !== "object" ||
      Array.isArray(item)
    ) {

      throw httpError(
        400,
        "Existe um link inválido no JSON."
      );

    }

  }

}



// =========================================================
// PUBLICAR NO GITHUB
// =========================================================

async function publishLinksToGitHub(
  data,
  env,
  session
) {

  requireGitHubConfig(
    env
  );


  const token =
    await getGitHubInstallationToken(
      env
    );


  const owner =
    env.GITHUB_OWNER;


  const repo =
    env.GITHUB_REPO;


  const branch =
    env.GITHUB_BRANCH ||
    "main";


  const path =
    env.GITHUB_FILE ||
    "data/links.json";


  const apiPath =

    `https://api.github.com/repos/` +

    `${encodeURIComponent(owner)}/` +

    `${encodeURIComponent(repo)}/` +

    `contents/` +

    path
      .split("/")
      .map(
        encodeURIComponent
      )
      .join("/");


  // -------------------------------------------------------
  // Obter SHA atual
  // -------------------------------------------------------

  const currentResponse =
    await fetch(

      `${apiPath}?ref=` +
      `${encodeURIComponent(branch)}`,

      {

        method:
          "GET",

        headers:
          githubHeaders(
            token
          )

      }

    );


  if (
    !currentResponse.ok
  ) {

    const details =
      await safeResponseText(
        currentResponse
      );


    throw httpError(

      502,

      `GitHub não conseguiu obter o ficheiro atual ` +
      `(${currentResponse.status}). ${details}`

    );

  }


  const current =
    await currentResponse.json();


  if (
    !current.sha
  ) {

    throw httpError(
      502,
      "O GitHub não devolveu o SHA do ficheiro atual."
    );

  }



  // -------------------------------------------------------
  // Preparar JSON
  // -------------------------------------------------------

  const prettyJson =
    JSON.stringify(
      data,
      null,
      2
    ) + "\n";


  const content =
    utf8ToBase64(
      prettyJson
    );



  // -------------------------------------------------------
  // Atualizar ficheiro
  // -------------------------------------------------------

  const updateResponse =
    await fetch(

      apiPath,

      {

        method:
          "PUT",

        headers:
          githubHeaders(
            token
          ),

        body:
          JSON.stringify(
            {

              message:
                "676 CMS: atualização dos links",

              content,

              sha:
                current.sha,

              branch

            }
          )

      }

    );


  if (
    !updateResponse.ok
  ) {

    const details =
      await safeResponseText(
        updateResponse
      );


    throw httpError(

      502,

      `GitHub recusou a atualização ` +
      `(${updateResponse.status}). ${details}`

    );

  }


  const updated =
    await updateResponse.json();


  return {

    commit: {

      sha:
        updated.commit?.sha ||
        null,

      url:
        updated.commit?.html_url ||
        null

    },

    file: {

      path:
        updated.content?.path ||
        path,

      sha:
        updated.content?.sha ||
        null

    },

    user:
      session.username

  };

}



// =========================================================
// GITHUB INSTALLATION TOKEN
// =========================================================

async function getGitHubInstallationToken(
  env
) {

  const jwt =
    await createGitHubAppJwt(

      env.GITHUB_APP_ID,

      env.GITHUB_PRIVATE_KEY

    );


  const response =
    await fetch(

      `https://api.github.com/app/installations/` +
      `${encodeURIComponent(
        env.GITHUB_INSTALLATION_ID
      )}/access_tokens`,

      {

        method:
          "POST",

        headers: {

          "Accept":
            "application/vnd.github+json",

          "Authorization":
            `Bearer ${jwt}`,

          "X-GitHub-Api-Version":
            "2022-11-28",

          "Content-Type":
            "application/json",

          "User-Agent":
            "Agrupamento-676-CMS"

        },

        body:
          JSON.stringify(
            {

              repositories: [
                env.GITHUB_REPO
              ],

              permissions: {

                contents:
                  "write"

              }

            }
          )

      }

    );


  if (
    !response.ok
  ) {

    const details =
      await safeResponseText(
        response
      );


    throw httpError(

      502,

      `Não foi possível obter o token da GitHub App ` +
      `(${response.status}). ${details}`

    );

  }


  const result =
    await response.json();


  if (
    !result.token
  ) {

    throw httpError(
      502,
      "O GitHub não devolveu installation token."
    );

  }


  return result.token;

}



// =========================================================
// CRIAR JWT DA GITHUB APP
// =========================================================

async function createGitHubAppJwt(
  appId,
  privateKeyPem
) {

  if (
    !appId ||
    !privateKeyPem
  ) {

    throw httpError(
      500,
      "Configuração da GitHub App incompleta."
    );

  }


  const now =
    Math.floor(
      Date.now() / 1000
    );


  const header = {

    alg:
      "RS256",

    typ:
      "JWT"

  };


  const payload = {

    // pequeno recuo para evitar
    // diferenças de relógio

    iat:
      now - 60,

    // GitHub aceita JWT de curta duração

    exp:
      now + 9 * 60,

    iss:
      String(appId)

  };


  const encodedHeader =
    base64UrlEncode(

      new TextEncoder()
        .encode(
          JSON.stringify(
            header
          )
        )

    );


  const encodedPayload =
    base64UrlEncode(

      new TextEncoder()
        .encode(
          JSON.stringify(
            payload
          )
        )

    );


  const unsignedToken =

    `${encodedHeader}.` +
    `${encodedPayload}`;


  const key =
    await importRsaPrivateKey(
      privateKeyPem
    );


  const signature =
    await crypto.subtle.sign(

      {

        name:
          "RSASSA-PKCS1-v1_5"

      },

      key,

      new TextEncoder()
        .encode(
          unsignedToken
        )

    );


  return (

    unsignedToken +

    "." +

    base64UrlEncode(
      new Uint8Array(
        signature
      )
    )

  );

}



// =========================================================
// IMPORTAR PRIVATE KEY
// Suporta:
//   -----BEGIN PRIVATE KEY-----      (PKCS#8)
//   -----BEGIN RSA PRIVATE KEY-----  (PKCS#1 / GitHub)
// =========================================================

async function importRsaPrivateKey(pem) {

  const normalized =
    String(pem)
      .replace(/\\n/g, "\n")
      .trim();


  let pkcs8Bytes;


  // =======================================================
  // PKCS#8
  // =======================================================

  if (
    normalized.includes(
      "-----BEGIN PRIVATE KEY-----"
    )
  ) {

    const base64 =
      normalized
        .replace(
          "-----BEGIN PRIVATE KEY-----",
          ""
        )
        .replace(
          "-----END PRIVATE KEY-----",
          ""
        )
        .replace(
          /\s+/g,
          ""
        );


    pkcs8Bytes =
      base64ToBytes(
        base64
      );

  }


  // =======================================================
  // PKCS#1
  // GitHub normalmente fornece este formato
  // =======================================================

  else if (
    normalized.includes(
      "-----BEGIN RSA PRIVATE KEY-----"
    )
  ) {

    const base64 =
      normalized
        .replace(
          "-----BEGIN RSA PRIVATE KEY-----",
          ""
        )
        .replace(
          "-----END RSA PRIVATE KEY-----",
          ""
        )
        .replace(
          /\s+/g,
          ""
        );


    const pkcs1Bytes =
      base64ToBytes(
        base64
      );


    pkcs8Bytes =
      pkcs1ToPkcs8(
        pkcs1Bytes
      );

  }


  // =======================================================
  // Formato desconhecido
  // =======================================================

  else {

    throw httpError(
      500,
      "Formato de GITHUB_PRIVATE_KEY não suportado."
    );

  }


  // =======================================================
  // Importar no Web Crypto
  // =======================================================

  return crypto.subtle.importKey(

    "pkcs8",

    pkcs8Bytes,

    {
      name:
        "RSASSA-PKCS1-v1_5",

      hash:
        "SHA-256"
    },

    false,

    [
      "sign"
    ]

  );

}



// =========================================================
// PKCS#1 → PKCS#8
// =========================================================

function pkcs1ToPkcs8(
  pkcs1Bytes
) {

  /*
   * PKCS#8 PrivateKeyInfo:
   *
   * SEQUENCE
   *   INTEGER 0
   *   SEQUENCE
   *     OID rsaEncryption
   *     NULL
   *   OCTET STRING
   *     PKCS#1 RSA PRIVATE KEY
   */


  const rsaAlgorithmIdentifier =
    new Uint8Array([
      0x30, 0x0d,
      0x06, 0x09,
      0x2a, 0x86, 0x48,
      0x86, 0xf7, 0x0d,
      0x01, 0x01, 0x01,
      0x05, 0x00
    ]);


  const version =
    new Uint8Array([
      0x02,
      0x01,
      0x00
    ]);


  const privateKey =
    derWrap(
      0x04,
      pkcs1Bytes
    );


  const body =
    concatBytes(
      version,
      rsaAlgorithmIdentifier,
      privateKey
    );


  return derWrap(
    0x30,
    body
  );

}



// =========================================================
// DER WRAPPER
// =========================================================

function derWrap(
  tag,
  content
) {

  const length =
    derLength(
      content.length
    );


  return concatBytes(

    new Uint8Array([
      tag
    ]),

    length,

    content

  );

}



// =========================================================
// DER LENGTH
// =========================================================

function derLength(
  length
) {

  if (
    length < 128
  ) {

    return new Uint8Array([
      length
    ]);

  }


  const bytes = [];

  let value =
    length;


  while (
    value > 0
  ) {

    bytes.unshift(
      value & 0xff
    );

    value >>=
      8;

  }


  return new Uint8Array([

    0x80 |
    bytes.length,

    ...bytes

  ]);

}



// =========================================================
// CONCAT UINT8ARRAY
// =========================================================

function concatBytes(
  ...arrays
) {

  const totalLength =
    arrays.reduce(
      (
        total,
        array
      ) =>
        total +
        array.length,
      0
    );


  const result =
    new Uint8Array(
      totalLength
    );


  let offset = 0;


  for (
    const array of arrays
  ) {

    result.set(
      array,
      offset
    );

    offset +=
      array.length;

  }


  return result;

}


  const base64 =
    normalized

      .replace(
        pkcs8Header,
        ""
      )

      .replace(
        pkcs8Footer,
        ""
      )

      .replace(
        /\s+/g,
        ""
      );


  const der =
    base64ToBytes(
      base64
    );


  return crypto.subtle.importKey(

    "pkcs8",

    der,

    {

      name:
        "RSASSA-PKCS1-v1_5",

      hash:
        "SHA-256"

    },

    false,

    [
      "sign"
    ]

  );

}



// =========================================================
// GITHUB HEADERS
// =========================================================

function githubHeaders(
  token
) {

  return {

    "Accept":
      "application/vnd.github+json",

    "Authorization":
      `Bearer ${token}`,

    "X-GitHub-Api-Version":
      "2022-11-28",

    "Content-Type":
      "application/json",

    "User-Agent":
      "Agrupamento-676-CMS"

  };

}



// =========================================================
// VALIDAR CONFIGURAÇÃO GITHUB
// =========================================================

function requireGitHubConfig(
  env
) {

  const required = [

    "GITHUB_APP_ID",

    "GITHUB_INSTALLATION_ID",

    "GITHUB_PRIVATE_KEY",

    "GITHUB_OWNER",

    "GITHUB_REPO"

  ];


  const missing =
    required.filter(
      name =>
        !env[name]
    );


  if (
    missing.length
  ) {

    throw httpError(

      500,

      `Configuração GitHub incompleta: ` +
      `${missing.join(", ")}`

    );

  }

}



// =========================================================
// UTF-8 → BASE64
// =========================================================

function utf8ToBase64(
  text
) {

  const bytes =
    new TextEncoder()
      .encode(
        text
      );


  let binary = "";


  const chunk =
    0x8000;


  for (
    let i = 0;
    i < bytes.length;
    i += chunk
  ) {

    binary +=
      String.fromCharCode(

        ...bytes.subarray(
          i,
          i + chunk
        )

      );

  }


  return btoa(
    binary
  );

}



// =========================================================
// BASE64 URL
// =========================================================

function base64UrlEncode(
  bytes
) {

  let binary = "";


  for (
    let i = 0;
    i < bytes.length;
    i++
  ) {

    binary +=
      String.fromCharCode(
        bytes[i]
      );

  }


  return btoa(
    binary
  )

    .replace(
      /\+/g,
      "-"
    )

    .replace(
      /\//g,
      "_"
    )

    .replace(
      /=+$/g,
      ""
    );

}



// =========================================================
// SAFE GITHUB ERROR
// =========================================================

async function safeResponseText(
  response
) {

  try {

    const text =
      await response.text();


    return text.slice(
      0,
      800
    );


  } catch {

    return "";

  }

}



// =========================================================
// HTTP ERROR
// =========================================================

function httpError(
  status,
  message
) {

  const error =
    new Error(
      message
    );


  error.status =
    status;


  return error;

}



// =========================================================
// BASE64
// =========================================================

function base64ToBytes(
  base64
) {

  const binary =
    atob(
      base64
    );


  const bytes =
    new Uint8Array(
      binary.length
    );


  for (
    let i = 0;
    i < binary.length;
    i++
  ) {

    bytes[i] =
      binary.charCodeAt(
        i
      );

  }


  return bytes;

}



// =========================================================
// HEX
// =========================================================

function bytesToHex(
  bytes
) {

  return Array.from(
    bytes
  )

    .map(

      b =>
        b
          .toString(16)
          .padStart(
            2,
            "0"
          )

    )

    .join("");

}



// =========================================================
// JSON RESPONSE
// =========================================================

function jsonResponse(
  data,
  status = 200,
  extraHeaders = {}
) {

  const headers =
    new Headers(
      extraHeaders
    );


  headers.set(

    "Content-Type",

    "application/json; charset=UTF-8"

  );


  headers.set(

    "Cache-Control",

    "no-store"

  );


  return new Response(

    JSON.stringify(
      data,
      null,
      2
    ),

    {

      status,

      headers

    }

  );

}