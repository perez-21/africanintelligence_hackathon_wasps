
import axios from 'axios';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'https://africanapi.onrender.com/api';

// Configure axios defaults
const configureAxios = (token) => {
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
  }
};

// Request notification permission
export const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Initialize notifications (service worker registration)
export const initializeNotifications = async () => {
  try {
    if (!('serviceWorker' in navigator)) {
      console.log('Service workers are not supported in this browser');
      return null;
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered successfully:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    throw error;
  }
};

// Subscribe to push notifications
export const subscribeToPushNotifications = async (subscription, token) => {
  configureAxios(token);
  try {
    const response = await axios.post(`${API_URL}/notifications/subscribe`, {
      subscription
    });
    return response.data;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    throw error;
  }
};

// Subscribe to course notifications
export const subscribeToCourseNotifications = async (courseId, token) => {
  configureAxios(token);
  try {
    const response = await axios.post(`${API_URL}/notifications/subscribe/course/${courseId}`);
    return response.data;
  } catch (error) {
    console.error(`Error subscribing to course notifications for ${courseId}:`, error);
    throw error;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async (token) => {
  configureAxios(token);
  try {
    const response = await axios.delete(`${API_URL}/notifications/unsubscribe`);
    return response.data;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    throw error;
  }
};

// Get notification settings
export const getNotificationSettings = async (token) => {
  configureAxios(token);
  try {
    const response = await axios.get(`${API_URL}/notifications/settings`);
    return response.data;
  } catch (error) {
    console.error('Error getting notification settings:', error);
    throw error;
  }
};

// Update notification settings
export const updateNotificationSettings = async (settings, token) => {
  configureAxios(token);
  try {
    const response = await axios.put(`${API_URL}/notifications/settings`, settings);
    return response.data;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
};

// Get recent notifications
export const getRecentNotifications = async (token) => {
  configureAxios(token);
  try {
    const response = await axios.get(`${API_URL}/notifications/recent`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recent notifications:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId, token) => {
  configureAxios(token);
  try {
    const response = await axios.put(`${API_URL}/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (token) => {
  configureAxios(token);
  try {
    const response = await axios.put(`${API_URL}/notifications/read-all`);
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};
