// src/utils/auth.js
// Simple wrapper around localStorage for JWT and user info
export function setToken(token) {
  localStorage.setItem('token', token);
}
export function getToken() {
  return localStorage.getItem('token');
}
export function setUserRole(role) {
  localStorage.setItem('role', role);
}
export function getUserRole() {
  return localStorage.getItem('role');
}
export function setUserName(name) {
  localStorage.setItem('name', name);
}
export function getUserName() {
  return localStorage.getItem('name');
}
export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('name');
}
