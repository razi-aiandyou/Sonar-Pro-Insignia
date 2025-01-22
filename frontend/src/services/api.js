const API_BASE_URL = 'http://localhost:5000'

export const sendMessage = async (message, threadId) => {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, thread: threadId }),
  })

  if (!response.ok) {
    throw new Error('Network response was not ok')
  }

  return response.json()
}