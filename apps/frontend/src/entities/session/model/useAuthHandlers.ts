import { LoginResponseData, Server } from "@shared/types";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { useSessionStore } from "./auth.store";

export const useAuthHandlers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useSessionStore((s) => s.setUser);
  const setToken = useSessionStore((s) => s.setToken);
  const qc = useQueryClient();

  const handleLoginSuccess = (data: LoginResponseData) => {
    setToken(data.token);
    setUser(data.user);
    qc.setQueryData(['user'], data.user);

    const search = new URLSearchParams(location.search);
    const redirect = search.get('redirect') || '/';
    navigate(redirect, { replace: true });
  }

  const handleAcceptInviteSuccess = (data: Server) => {
    // TODO: set selected server
    navigate('/');
  }

  return {
    handleLoginSuccess,
    handleAcceptInviteSuccess,
  }
}