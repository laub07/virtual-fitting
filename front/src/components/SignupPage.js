import React, { useState } from "react";
import "./SignupPage.css";

function SignUp() {
    const [form, setForm] = useState({
        id: "",
        password: "",
        passwordConfirm: "",
        name: "",
        phone: ""
    });

    const [message, setMessage] = useState("");
    const [isMatch, setIsMatch] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;

        const updatedForm = {
            ...form,
            [name]: value
        };

        setForm(updatedForm);

        if (updatedForm.password && updatedForm.passwordConfirm) {
            if (updatedForm.password === updatedForm.passwordConfirm) {
                setMessage("비밀번호가 일치합니다");
                setIsMatch(true);
            } else {
                setMessage("비밀번호가 일치하지 않습니다");
                setIsMatch(false);
            }
        } else {
            setMessage("");
            setIsMatch(null);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (
            !form.name ||
            !form.phone ||
            !form.id ||
            !form.password ||
            !form.passwordConfirm
        ) {
            alert("모든 정보를 입력해주세요!");
            return;
        }

        if (form.password !== form.passwordConfirm) {
            alert("비밀번호가 일치하지 않습니다!");
            return;
        }

        const userData = {
            id: form.id,
            password: form.password,
            name: form.name,
            phone: form.phone
        };

        localStorage.setItem("user", JSON.stringify(userData));

        alert("회원가입 완료!");
        window.location.href = "/login";
    };

    return (
        <div className="signup-container">
            <h2>회원가입</h2>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="id"
                    placeholder="아이디"
                    value={form.id}
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
                    type="password"
                    name="passwordConfirm"
                    placeholder="비밀번호 확인"
                    value={form.passwordConfirm}
                    onChange={handleChange}
                />

                {message && (
                    <p className={`password-message ${isMatch ? "success" : "error"}`}>
                        {message}
                    </p>
                )}

                <input
                    type="text"
                    name="name"
                    placeholder="이름"
                    value={form.name}
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
        </div>
    );
}

export default SignUp;