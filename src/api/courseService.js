import axios from 'axios';
import { clg } from '../lib/basic';
import { id } from 'date-fns/locale';

// API base URL
const API_URL = 'http://localhost:3031/api';

// Configure axios defaults
const configureAxios = (token) => {
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
  }
};

// Get all published courses
export const getAllCourses = async (token) => {
  configureAxios(token);
  try {
    const response = await axios.get(`${API_URL}/courses`);
    return response.data;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

// Get facilitator's courses
export const getFacilitatorCourses = async (token) => {
  configureAxios(token);
  try {
    const response = await axios.get(`${API_URL}/facilitator/courses`);
    return response.data;
  } catch (error) {
    console.error('Error fetching facilitator courses:', error);
    throw error;
  }
};

// Get facilitator's draft courses
export const getFacilitatorDraftCourses = async (token) => {
  configureAxios(token);
  try {
    const response = await axios.get(`${API_URL}/facilitator/courses/drafts`);
    return response.data;
  } catch (error) {
    console.error('Error fetching facilitator draft courses:', error);
    throw error;
  }
};

// Get course by ID
export const getCourseById = async (courseId, token) => {
  configureAxios(token);
  try {
    const response = await axios.get(`${API_URL}/courses/${courseId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching course ${courseId}:`, error);
    throw error;
  }
};

// Get course full details - Adding this as it might be missing
export const getCourseFullDetails = async (courseId, token) => {
  return getCourseById(courseId, token);
};

// Create new course
export const createCourse = async (courseData, token) => {
  configureAxios(token);
  try {
    const response = await axios.post(`${API_URL}/courses`, courseData, {
      headers: {
        'x-auth-token': token
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

// Update course
export const updateCourse = async (courseId, courseData, token) => {
  configureAxios(token);
  try {
    const response = await axios.put(`${API_URL}/courses/${courseId}`, courseData, {
      headers: {
        'x-auth-token': token
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating course ${courseId}:`, error);
    throw error;
  }
};

// Delete course
export const deleteCourse = async (courseId, token) => {
  configureAxios(token);
  try {
    const response = await axios.delete(`${API_URL}/facilitator/courses/${courseId}`, {
      headers: {
        'x-auth-token': token
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting course ${courseId}:`, error);
    throw error;
  }
};

// Get course analytics (for facilitators)
export const getCourseAnalytics = async (courseId, token) => {
  configureAxios(token);
  try {
    const response = await axios.get(`${API_URL}/facilitator/courses/${courseId}/analytics`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching analytics for course ${courseId}:`, error);
    throw error;
  }
};

// Get course students (for facilitators)
export const getCourseStudents = async (courseId, token) => {
  configureAxios(token);
  try {
    const response = await axios.get(`${API_URL}/facilitator/courses/${courseId}/students`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching students for course ${courseId}:`, error);
    throw error;
  }
};

// Get learner's enrolled courses
export const getLearnerCourses = async (token) => {
  configureAxios(token);
  try {
    const response = await axios.get(`${API_URL}/learner/courses`);
    return response.data;
  } catch (error) {
    console.error('Error fetching learner courses:', error);
    throw error;
  }
};

// Update module progress - renamed to updateCourseProgress to match backend API
export const updateCourseProgress = async (courseId, moduleId, contentId, completed, token) => {
  configureAxios(token);
  try {
    // Make sure we're sending proper data
    if (!courseId || !moduleId || !contentId) {
      console.error('Missing required parameters for updateCourseProgress');
      throw new Error('Missing required parameters');
    }
    
    const response = await axios.put(`${API_URL}/learner/courses/${courseId}/progress`, {
      moduleId,
      contentId,
      completed
    }, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error updating progress for module ${moduleId}:`, error);
    throw error;
  }
};

// For compatibility with previous code - this will be deprecated
export const updateModuleProgress = (courseId, moduleId, contentId, completed, token) => {
  console.warn('updateModuleProgress is deprecated, use updateCourseProgress instead');
  return updateCourseProgress(courseId, moduleId, contentId, completed, token);
};

// Submit quiz
export const submitQuiz = async (courseId, moduleId, answers, token) => {
  configureAxios(token);
  try {
    const response = await axios.post(`${API_URL}/courses/${courseId}/modules/${moduleId}/quiz`, {
      answers
    });
    return response.data;
  } catch (error) {
    console.error(`Error submitting quiz for module ${moduleId}:`, error);
    throw error;
  }
};

export const getEnrollment = async (courseKey, token) => {
  configureAxios(token);
  try {
    const response = await axios.get(`${API_URL}/enrollments/`, {headers: {
      'x-auth-token': token
    }});
  }
  catch (error) {
    console.error(`Error getting enrollment`);
  }
}

// Enroll in a course
export const enrollInCourse = async (courseId, token) => {
  configureAxios(token);
  try {
clg('enroll id - ',courseId);    
    const response = await axios.post(`${API_URL}/courses/${courseId}/enroll`, {courseId}, {
      headers: {
        'x-auth-token': token
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error enrolling in course ${courseId}:`, error);
    throw error;
  }
};

// Check if enrolled in a course
export const checkEnrollmentStatus = async (courseId, token) => {
  if (!courseId || !token) return false;
  
  configureAxios(token);
  try {
    const response = await axios.get(`${API_URL}/learner/courses/${courseId}/status`);
    return response.data.isEnrolled;
  } catch (error) {
    console.error(`Error checking enrollment status for course ${courseId}:`, error);
    return false;
  }
};

// Get course details with student progress (for enrolled students)
export const getEnrolledCourseWithProgress = async (courseId, token) => {
  configureAxios(token);
  try {
    const response = await axios.get(`${API_URL}/learner/courses/${courseId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching enrolled course with progress ${courseId}:`, error);
    throw error;
  }
};

// Get student's course progress
export const getStudentCourseProgress = async (courseId, token) => {
  configureAxios(token);
  try {
    const enrolledCourse = await getEnrolledCourseWithProgress(courseId, token);
    return {
      progress: enrolledCourse.progress || 0,
      moduleProgress: enrolledCourse.moduleProgress || []
    };
  } catch (error) {
    console.error(`Error fetching student course progress for ${courseId}:`, error);
    throw error;
  }
};

// Get all learning materials for a student
export const getStudentLearningMaterials = async (token) => {
  configureAxios(token);
  try {
    const response = await axios.get(`${API_URL}/learner/courses`);
    return response.data;
  } catch (error) {
    console.error('Error fetching student learning materials:', error);
    throw error;
  }
};

// Sync enrollment data (to fix data inconsistency issues)
export const syncEnrollmentData = async (token) => {
  configureAxios(token);
  try {
    const response = await axios.post(`${API_URL}/learner/sync-enrollments`, {}, {
      headers: {
        'x-auth-token': token
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error syncing enrollment data:', error);
    throw error;
  }
};

// Get course forum posts
export const getCourseForumPosts = async (courseId, token) => {
  configureAxios(token);
  try {
    const response = await axios.get(`${API_URL}/forum/course/${courseId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching forum posts for course ${courseId}:`, error);
    throw error;
  }
};

// Create new forum post
export const createForumPost = async (postData, token) => {
  configureAxios(token);
  try {
    const response = await axios.post(`${API_URL}/forum`, postData);
    return response.data;
  } catch (error) {
    console.error('Error creating forum post:', error);
    throw error;
  }
};

// Add comment to a post
export const addCommentToPost = async (postId, content, token) => {
  configureAxios(token);
  try {
    const response = await axios.post(`${API_URL}/forum/${postId}/comments`, { content });
    return response.data;
  } catch (error) {
    console.error(`Error adding comment to post ${postId}:`, error);
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

// Get learning stats for student
export const getLearningStats = async (token) => {
  configureAxios(token);
  try {
    const response = await axios.get(`${API_URL}/learner/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching learning stats:', error);
    throw error;
  }
};

// Get facilitator dashboard stats
export const getFacilitatorDashboardStats = async (token) => {
  configureAxios(token);
  try {
    const response = await axios.get(`${API_URL}/facilitator/dashboard`);
    return response.data;
  } catch (error) {
    console.error('Error fetching facilitator dashboard stats:', error);
    throw error;
  }
};

// Get all students for a facilitator
export const getFacilitatorStudents = async (token) => {
  configureAxios(token);
  try {
    const response = await axios.get(`${API_URL}/facilitator/students`);
    return response.data;
  } catch (error) {
    console.error('Error fetching facilitator students:', error);
    throw error;
  }
};

// Track video watch time
export const trackVideoWatchTime = async (courseId, moduleId, contentId, watchTime, duration, token) => {
  configureAxios(token);
  try {
    const response = await axios.post(`${API_URL}/learner/courses/${courseId}/watch-time`, {
      moduleId,
      contentId,
      watchTime,
      duration
    });
    return response.data;
  } catch (error) {
    console.error('Error tracking video watch time:', error);
    throw error;
  }
};

// Check if module can be marked as completed
export const checkModuleCompletion = async (courseId, moduleId, token) => {
  configureAxios(token);
  try {
    const response = await axios.get(`${API_URL}/learner/courses/${courseId}/modules/${moduleId}/check-completion`);
    return response.data;
  } catch (error) {
    console.error('Error checking module completion:', error);
    throw error;
  }
};

// Rate a course
export const rateCourse = async (courseId, rating, comment, token) => {
  configureAxios(token);
  try {
    const response = await axios.post(`${API_URL}/courses/${courseId}/rate`, {
      rating,
      comment
    });
    return response.data;
  } catch (error) {
    console.error(`Error rating course ${courseId}:`, error);
    throw error;
  }
};

// Get course ratings
export const getCourseRatings = async (courseId, token) => {
  configureAxios(token);
  try {
    const response = await axios.get(`${API_URL}/courses/${courseId}/ratings`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ratings for course ${courseId}:`, error);
    throw error;
  }
};
