import axios from "axios";

// Define the base URL correctly in the axios.create configuration
const API_BASE_URL = "http://172.17.10.82:8000/v1/api";
// const API_BASE_URL = "https://miracle-gpt-portal.azurewebsites.net/v1/api";
// const API_BASE_URL = "http://172.17.10.125:8000/v1/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL, // Corrected to baseURL
});

const userId = localStorage.getItem("userId");

export const getToken = async () => {
  try {
    const response = await axios.get('http://172.17.10.82:8000/v1/test'); // Use the desired URL for the token
    console.log('Token:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching token:', error);
  }
};


// Add a request interceptor to attach the token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default {
  get: {
    updateTitle: (userId) => {
      return apiClient.get(`/session`, {
        params: {
          userId,
        },
      });
    },
    getSessionHistory:(sessionId)=>{
      return apiClient.get(`/session/${sessionId}`,null,{
        
      })
    },
    getShareSessionHistory:(sessionId)=>{
      return apiClient.get(`/session/history/${sessionId}`,null,{
        
      })
    },
getShrabkeLink:(sessionId)=>{
  return apiClient.get(`/session/share/${sessionId}`,null,{
    
  })
},
    
    getShrabkeLink:(sessionId)=>{
      return apiClient.get(`/session/share/${sessionId}`,null,{
        
      })
    },
  },
  post: {
    chatMessages: (question, sessionId, files) => {
      // console.log(files, "Files")
      if(files.length) {
        const formData = new FormData();
        formData.append('image', files[0].file);
        formData.append('type', files[0].file.type);
        return apiClient.post(`/chat/${sessionId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data', // Important for file uploads
          },
          params: {
            question
          }
        });
      }
      else {
        return apiClient.post(`/chat/${sessionId}`, null, {
          params: {
            question,
          },
        });
    }
    },
    regenerateMessages: (question, messageId,sessionId) => {
      return apiClient.post(`chat/regenerate/${sessionId}/${messageId}`, null, {
        params: {
          question,
        },
      });
    },
    createSession: () => {
      return apiClient.post(`/session/new`,{
        "userId": userId,
        "title": "Chat 1"
      })
    },
    updateTitle: (userId) => {
      return apiClient.get(`/session`, {
        params: {
          userId,
        },
      });
    },
  },
  put: {
    updateTitle: (sessionId) => {
      return apiClient.put(`chat/${sessionId}`, null, {
      });
    },
    updateSessionTitle: (sessionId, newTitle) => {
      return apiClient.put(`/session?sessionId=${sessionId}`,null, {
        params: {
          newTitle,
        }
      })
    },
    storeSelectedAnswer: (sessionId, messageId, direction) => {
      return apiClient.put(`/chat/${sessionId}/${messageId}/${direction}`,null, {

      })
    }
  },
  delete: {
    deleteDuplicate: (sessionId,messageId) => {
      return apiClient.delete(`/session?sessionId=${sessionId}&messageId=${messageId}`,null,{
      });
    },
    deleteSession: (sessionId) => {
      return apiClient.delete(`/session/deleteSession?sessionId=${sessionId}`,null,{
      });
    }
  },
};
