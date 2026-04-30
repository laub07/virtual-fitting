import axios from "axios";

export const signupUser = async (signupData) => {
    const response = await axios.post(
        "http://localhost:8080/api/users/Signup",
        signupData
    );
    return response.data;
};