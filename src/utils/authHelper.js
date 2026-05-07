export function getCurrentUser() {
  const json = localStorage.getItem("user");
  if (!json) return null;

  return JSON.parse(json);
}

export function getCreatedBy() {
  const user = getCurrentUser();
  return user?.Username ?? "";
}
