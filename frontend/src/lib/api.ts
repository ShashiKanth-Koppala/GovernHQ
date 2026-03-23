const BASE_URL = import.meta.env.VITE_API_URL

export async function apiGet(path: string, token: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
  return res.json()
}

export async function apiPost(path: string, token: string, body: object) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function apiPatch(path: string, token: string, body: object) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  return res.json()
}