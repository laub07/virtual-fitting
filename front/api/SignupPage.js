import { useState } from "react";
import { signupUser } from "../api/user/userApi";

function SignupPage() {
    const [form, setForm] = useState({
        username: "",
        password: "",
        name: "",
        birth: "",
        phone: "",
        role: "USER",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: value,
        });
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        try {
            const result = await signupUser(form);
            alert("회원가입 성공!");
            console.log(result);
        } catch (error) {
            console.error(error);
            alert("회원가입 실패");
        }
    };

    return (
        <form onSubmit={handleSignup}>
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
            <input
                type="text"
                name="name"
                placeholder="이름"
                value={form.name}
                onChange={handleChange}
            />
            <input
                type="date"
                name="birth"
                value={form.birth}
                onChange={handleChange}
            />
            <input
                type="text"
                name="phone"
                placeholder="전화번호"
                value={form.phone}
                onChange={handleChange}
            />

            <button type="submit">회원가입</button>
        </form>
    );
}

export default SignupPage;