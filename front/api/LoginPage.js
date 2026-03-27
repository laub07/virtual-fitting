import { useState } from "react";
import { loginUser } from "../api/user/userApi";

function LoginPage() {
    const [form, setForm] = useState({
        username: "",
        password: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: value,
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const result = await loginUser(form);
            alert("로그인 성공!");
            console.log("로그인 응답:", result);

            localStorage.setItem("loginUser", JSON.stringify(result));
        } catch (error) {
            console.error(error);
            alert("로그인 실패");
        }
    };

    return (
        <form onSubmit={handleLogin}>
            <input
                type="text"
                name="username"
                placeholder="아이디"
                value={form.username}
                onChange={handleChange}
            />
            <input
                type="password"
                name="password"
                placeholder="비밀번호"
                value={form.password}
                onChange={handleChange}
            />
            <button type="submit">로그인</button>
        </form>
    );
}

export default LoginPage;