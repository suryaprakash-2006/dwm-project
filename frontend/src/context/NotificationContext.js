import React, { createContext, useContext, useState, useEffect } from "react";
import config from "../config";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${config.API_URL}/notifications`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.warn("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const addNotification = async (notif) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${config.API_URL}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(notif)
      });
      if (res.ok) {
        const created = await res.json();
        setNotifications((prev) => [created, ...prev]);
      }
    } catch (err) {
      console.warn("Failed to add notification", err);
    }
  };

  const markRead = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${config.API_URL}/notifications/${id}/read`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      }
    } catch (err) {
      console.warn("Failed to mark notification as read", err);
    }
  };

  const markAllRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${config.API_URL}/notifications/read-all`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.warn("Failed to mark all notifications as read", err);
    }
  };

  const deleteNotification = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return false;
    try {
      const res = await fetch(`${config.API_URL}/notifications/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        let message = "Failed to delete notification";
        try {
          const errData = await res.json();
          message = errData.detail || message;
        } catch (parseErr) {
          // Ignore JSON parsing issues and use the fallback message.
        }
        throw new Error(message);
      }

      const data = await res.json();
      if (!data?.success) {
        throw new Error(data?.message || "Failed to delete notification");
      }

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      return true;
    } catch (err) {
      console.warn("Failed to delete notification", err);
      throw err;
    }
  };

  const clearAllNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return false;
    try {
      const res = await fetch(`${config.API_URL}/notifications`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        let message = "Failed to clear notifications";
        try {
          const errData = await res.json();
          message = errData.detail || message;
        } catch (parseErr) {
          // Ignore JSON parsing issues and use the fallback message.
        }
        throw new Error(message);
      }

      const data = await res.json();
      if (data?.deletedCount === undefined) {
        throw new Error(data?.message || "Failed to clear notifications");
      }

      setNotifications([]);
      return true;
    } catch (err) {
      console.warn("Failed to clear notifications", err);
      throw err;
    }
  };

  const getForUser = () => notifications;

  const unreadCount = () => notifications.filter((n) => !n.read).length;

  const addResetRequest = async (empNo) => {
    try {
      const res = await fetch(`${config.API_URL}/auth/reset-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empNo })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to request password reset");
      }
      return true;
    } catch (err) {
      console.warn("Forgot password reset request failed", err);
      throw err;
    }
  };

  const getResetStatus = async (empNo) => {
    try {
      const res = await fetch(`${config.API_URL}/auth/reset-status/${empNo}`);
      if (res.ok) {
        const data = await res.json();
        return data.status;
      }
    } catch (err) {
      console.warn("Failed to get reset status", err);
    }
    return null;
  };

  const approvePasswordReset = async (notifId, empNo) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${config.API_URL}/auth/reset-requests/${empNo}/action`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ action: "approve" })
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.warn("Failed to approve password reset", err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, fetchNotifications, addNotification, markRead, markAllRead, deleteNotification, clearAllNotifications, getForUser, unreadCount, approvePasswordReset, addResetRequest, getResetStatus }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
