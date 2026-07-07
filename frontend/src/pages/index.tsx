"use client";
import Login from "./login";
import { useEffect, useState } from "react";
import axios from "axios";
import Registration from "./Registration";
import { secretKey } from "@/util/config";

const Home = () => {
  const [showLogin, setShowLogin] = useState(true);

  useEffect(() => {
    axios
      .get("admin/login", {
        headers: { key: secretKey },
      })
      .then((res) => {
        setShowLogin(res.data?.login ?? true);
      })
      .catch((err) => {
        console.log(err);
        setShowLogin(true);
      });
  }, []);

  return showLogin ? <Login /> : <Registration />;
};

export default Home;
