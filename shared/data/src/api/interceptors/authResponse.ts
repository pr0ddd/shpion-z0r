export const authResponseErrorHandler = (err: any) => {
  // TODO: fix types
  if (err.response?.status === 401) {
    localStorage.removeItem('authToken');
    window.dispatchEvent(new Event('auth-error'));
  }
  return Promise.reject(err);
}
