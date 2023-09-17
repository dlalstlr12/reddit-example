import Link from "next/link";
import { Fragment } from "react";
import { useAuthState, useAuthDispatch } from "../context/auth";
import axios from "axios";
import { Post } from "../types";
import { useRouter } from "next/router";
import useSWR from "swr";
export const Navbar: React.FC = () =>{
    const { loading, authenticated } = useAuthState();
    const dispatch = useAuthDispatch();
    const router = useRouter();
    const username = router.query.username;
    const { data, error } = useSWR(username ? `/users/${username}` : null);
    

    const handleLogout = () => {
        axios.post("/auth/logout")
            .then(() => {
                dispatch("LOGOUT");
                window.location.reload();
            })
            .catch((error) => {
                console.log(error);
            })
    }
    //if (!data) return null;
    return (
        <div className="fixed inset-x-0 top-0 z-10 flex items-center justify-between px-5 bg-white h-13">
            <span className="text-2xl font-semibold text-gray-400">
                <Link href="/">Commuity</Link>
            </span>
            
            
            <div className="max-w-full px-4">
                <div className="relative flex items-center bg-gray-100 border rounded hover:border-gray-700 hover:bg-white">
                    <i className="pl-4 pr-3 text-gray-400 fas fa-search"></i>
                    <input
                        type="text"
                        placeholder="Search Reddit"
                        className="px-3 py-1 bg-transparent rounded h-7 focus:outline-none"
                    />
                </div>
            </div>
            

            <div className="flex">
                {!loading && 
                    (authenticated ? (
                        <div>
                            <a className="mx-1 hover:underline">
                                {username}
                            </a>
                        <button
                            className="w-20 px-2 mr-2 text-sm text-center text-white bg-gray-400 rounded h-7"
                            onClick={handleLogout}
                        >
                            로그아웃
                        </button>
                        </div>
                    ) : (
                        <Fragment>
                        <Link href="/login" legacyBehavior>
                            <a className="w-20 px-2 pt-1 mr-2 text-sm text-center text-blue-500 border border-blue-500 rounded h-7">
                                로그인
                            </a>
                        </Link>
                        <Link href="/register" legacyBehavior>
                            <a className="w-20 px-2 pt-1 text-sm text-center text-white bg-gray-400 rounded h-7">
                                회원가입
                            </a>
                        </Link>
                        </Fragment>
                    )
                )}
            </div>
        </div>
    );
};

export default Navbar;