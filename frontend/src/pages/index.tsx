"use client";
import { Inter } from "next/font/google";
import Login from "./login";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import Registration from "./Registration";

const inter = Inter({ subsets: ["latin"] });

const Home = () => {
  const [login, setLogin] = useState(true);

  useEffect(() => {
    axios
      .get("admin/login")
      .then((res) => {
        setLogin(res.data.login);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

 

  return login ? <Login /> : <Registration />;
};

export default Home;
