import React, {useState} from "react";
import "./SignupPage.css";

function SignUp() {
    const [form, setForm] = useState({
        id: "",
        password: "",
        name: "",
        phone: ""
    });

    // 입력값 변경
    const handleChange = (e) => {
        const {name, value} = e.target;
        setForm({
            ...form,
            [name]: value
        });
    };

    // 회원가입 버튼 클릭
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!form.name || !form.phone || !form.id || !form.password) {
            alert("모든 정보를 입력해주세요!");
            return;
        }

        // localStorage 저장
        localStorage.setItem("user", JSON.stringify(form));

        alert("회원가입 완료!");
        window.location.href = "/login"; // 로그인 페이지로 이동
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
                    name="password"
                    placeholder="비밀번호 확인"
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