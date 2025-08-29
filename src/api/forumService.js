
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7000/api'//'https://africanapi.onrender.com/api';

// Forum post services
export const getCourseForum = async (courseId, token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/forum/course/${courseId}`, {
      headers: { 'x-auth-token': token }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching course forum:', error);
    throw error;
  }
};

export const getCommunityForum = async (token, category = null, page = 1, limit = 20) => {
  try {
    let url = `${API_BASE_URL}/forum/community?page=${page}&limit=${limit}`;
    if (category) {
      url += `&category=${category}`;
    }
    
    const response = await axios.get(url, {
      headers: { 'x-auth-token': token }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching community forum:', error);
    throw error;
  }
};

export const getForumPost = async (postId, token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/forum/post/${postId}`, {
      headers: { 'x-auth-token': token }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching forum post:', error);
    throw error;
  }
};

export const createForumPost = async (postData, token) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/forum/`, postData, {
      headers: { 'x-auth-token': token }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating forum post:', error);
    throw error;
  }
};

export const updateForumPost = async (postId, postData, token) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/forum/post/${postId}`, postData, {
      headers: { 'x-auth-token': token }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating forum post:', error);
    throw error;
  }
};

export const deleteForumPost = async (postId, token) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/forum/post/${postId}`, {
      headers: { 'x-auth-token': token }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting forum post:', error);
    throw error;
  }
};

// Forum comment services
export const addForumComment = async (postId, commentData, token) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/forum/post/${postId}/comment`, 
      commentData,
      { headers: { 'x-auth-token': token } }
    );
    return response.data;
  } catch (error) {
    console.error('Error adding forum comment:', error);
    throw error;
  }
};

export const deleteForumComment = async (postId, commentId, token) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/forum/post/${postId}/comment/${commentId}`,
      { headers: { 'x-auth-token': token } }
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting forum comment:', error);
    throw error;
  }
};

// Forum like services
export const togglePostLike = async (postId, token) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/forum/post/${postId}/like`,
      {},
      { headers: { 'x-auth-token': token } }
    );
    return response.data;
  } catch (error) {
    console.error('Error toggling post like:', error);
    throw error;
  }
};

// Forum category services
export const getForumCategories = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/forum/categories`, {
      headers: { 'x-auth-token': token }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching forum categories:', error);
    throw error;
  }
};

// Get trending/popular topics
export const getTrendingTopics = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/forum/trending`, {
      headers: { 'x-auth-token': token }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    throw error;
  }
};

// Get unanswered topics
export const getUnansweredTopics = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/forum/unanswered`, {
      headers: { 'x-auth-token': token }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching unanswered topics:', error);
    throw error;
  }
};
