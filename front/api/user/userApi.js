import axios from "axios";

const BASE_URL = "http://localhost:8080/api/users";

export const signupUser = async (userData) => {
    const response = await axios.post(`${BASE_URL}/signup`, userData);
    return response.data;
};

export const loginUser = async (loginData) => {
    const response = await axios.post(`${BASE_URL}/login`, loginData);
    return response.data;
};

export const getUsers = async () => {
    const response = await axios.get(BASE_URL);
    return response.data;
};

export const deleteUser = async (id) => {
    const response = await axios.delete(`${BASE_URL}/${id}`);
    return response.data;
};