import axios from 'axios';

// ─── Azure Container Apps URLs ────────────────────────────────────────────────
// Replace these with your actual Azure Container Apps FQDNs after deployment.
// Format: https://<service-name>.<unique-id>.<region>.azurecontainerapps.io
//
// Get them by running:
//   az containerapp show --name user-service --resource-group food-order-rg \
//     --query properties.configuration.ingress.fqdn --output tsv
//
// For local development, the URLs below point to localhost as before.

const IS_LOCAL = window.location.hostname === 'localhost';

const USER_API    = 'https://user-service.greenhill-3759a5f1.eastus.azurecontainerapps.io';
const MENU_API    = 'https://menu-service.greenhill-3759a5f1.eastus.azurecontainerapps.io';
const ORDER_API   = 'https://order-service.greenhill-3759a5f1.eastus.azurecontainerapps.io';
const PAYMENT_API = 'https://payment-service.greenhill-3759a5f1.eastus.azurecontainerapps.io';

const authHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

// ── User Service ──────────────────────────────────────────────────────────────
export const registerUser = (data) =>
  axios.post(`${USER_API}/register`, data);

export const loginUser = (data) =>
  axios.post(`${USER_API}/login`, data);

export const getUser = (id, token) =>
  axios.get(`${USER_API}/users/${id}`, authHeader(token));

// ── Menu Service ──────────────────────────────────────────────────────────────
export const getMenuItems = () =>
  axios.get(`${MENU_API}/menu`);

export const getMenuItem = (id) =>
  axios.get(`${MENU_API}/menu/${id}`);

export const createMenuItem = (data, token) =>
  axios.post(`${MENU_API}/menu`, data, authHeader(token));

export const updateMenuItem = (id, data, token) =>
  axios.put(`${MENU_API}/menu/${id}`, data, authHeader(token));

export const deleteMenuItem = (id, token) =>
  axios.delete(`${MENU_API}/menu/${id}`, authHeader(token));

// ── Order Service ─────────────────────────────────────────────────────────────
export const placeOrder = (data, token) =>
  axios.post(`${ORDER_API}/orders`, data, authHeader(token));

export const getOrders = (token) =>
  axios.get(`${ORDER_API}/orders`, authHeader(token));

export const getOrder = (id, token) =>
  axios.get(`${ORDER_API}/orders/${id}`, authHeader(token));

// ── Payment Service ───────────────────────────────────────────────────────────
export const getPayments = (token) =>
  axios.get(`${PAYMENT_API}/payments`, authHeader(token));

export const getPaymentByOrder = (orderId, token) =>
  axios.get(`${PAYMENT_API}/payments/order/${orderId}`, authHeader(token));

// ── Health checks ─────────────────────────────────────────────────────────────
export const checkHealth = async () => {
  const services = [
    { name: 'User Service',    url: `${USER_API}/health` },
    { name: 'Menu Service',    url: `${MENU_API}/health` },
    { name: 'Order Service',   url: `${ORDER_API}/health` },
    { name: 'Payment Service', url: `${PAYMENT_API}/health` },
  ];
  const results = await Promise.allSettled(services.map(s => axios.get(s.url)));
  return services.map((s, i) => ({
    name: s.name,
    status: results[i].status === 'fulfilled' ? 'UP' : 'DOWN',
  }));
};
