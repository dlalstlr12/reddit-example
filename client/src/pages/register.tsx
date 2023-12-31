import Link from 'next/link'
import React, { FormEvent, useState } from 'react'
import InputGroup from '../components/inputGroup'
import Axios from 'axios';
import { useRouter } from 'next/router';
import { useAuthState } from '../context/auth';

const Register = () => {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<any>({});
    const { authenticated } = useAuthState();
    
    let router = useRouter();
    if(authenticated ) router.push("/");
    
    const handleSubmit = async( event: FormEvent)=>{
        event.preventDefault(); //페이지 새로고침을 막아주는 이벤트
        try{
            //백엔드에 회원가입을 위한 요청 및 회원가입 후 로그인 페이지로 자동 이동
            const res = await Axios.post("/auth/register",{
                email,
                password,
                username,
            });
            console.log(res);
            router.push("/login");
        } catch(error: any){
            //에러 발생 시 백엔드에서 전해오는 에러 error STATE에 저장
            console.log(error);
            setErrors(error?.response?.data || {});
        }
    }
  return (
    <div className="bg-white">
        <div className='flex flex-col items-center justify-content h-screen p-6'>
            <div className='w-10/12 mx-auto md:w-96'>
                <h1 className='md-2 text-lg font-mediun'>회원가입</h1>
                <form onSubmit={handleSubmit}>
                    <InputGroup
                        placeholder="Email"
                        value={email}
                        setValue={setEmail}
                        error={errors.email}
                    />
                    <InputGroup
                        placeholder="Username"
                        value={username}
                        setValue={setUsername}
                        error={errors.username}
                    />
                    <InputGroup
                        placeholder="Password"
                        value={password}
                        setValue={setPassword}
                        error={errors.password}
                    />
                    <button className='w-full py-2 mb-1 text-xs font-bold text-white uppercase bg-gray-400 border-gray-400 rounded'>
                        회원 가입
                    </button>
                </form>
                <small>
                    이미 가입하셨나요?
                    <Link href="/login" legacyBehavior>
                        <a className='ml-1 text-blue-500 upprcase'>로그인</a>
                    </Link>
                </small>
            </div>
        </div>

      
    </div>
  )
}

export default Register
