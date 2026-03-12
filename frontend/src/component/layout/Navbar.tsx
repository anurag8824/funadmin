"use client";
import { useEffect, useState } from "react";
import Logo from "../../assets/images/logo.svg";
import { useSelector } from "react-redux";
import Link from "next/link";
import Image from "next/image";
import { adminProfileGet } from "../../store/adminSlice";
import MenuIcon from "@mui/icons-material/Menu";
import { RootStore, useAppDispatch } from "../../store/store";
import { baseURL, projectName } from "@/util/config";

const Navbar = () => {
  const [showImage, setShowImage] = useState<string>();
  const dispatch = useAppDispatch();
  const getAdminData =
    typeof window !== "undefined" &&
    JSON.parse(sessionStorage.getItem("admin_"));

  const { admin } = useSelector((state: RootStore) => state.admin);
  const getAdminIn =
    typeof window !== "undefined" &&
    JSON.parse(sessionStorage.getItem("admin_"));
  const [adminData, setAdminData] = useState<{ name?: string; image?: string }>(
    {}
  );

  useEffect(() => {
    if (getAdminIn) {
      setAdminData(getAdminIn);
    }
  }, []);

  useEffect(() => {
    const payload: any = {
      adminId: getAdminData?._id,
    };
    dispatch(adminProfileGet(payload));
  }, []);

  return (
    <>
      <div className="mainNavbar webNav me-4">
        <div className="row">
          <div className="navBox " >
              <div style={{padding : "0px 20px"}}>
            <div
              className="navBar boxBetween px-4 "
              style={{ padding: "10px 0px" }}
            >
              <div className="navToggle " id={"toggle"}>
                <MenuIcon />
              </div>
              <div className=""></div>
              <div className="col-4 logo-show-nav">
                <div className="sideBarLogo boxCenter">
                  <Link
                    href={"/admin/dashboard"}
                    className="d-flex align-items-center"
                  >
                    <Image src={Logo} alt="logo" width={40} />
                    <span className="fs-3 fw-bold">{projectName}</span>
                  </Link>
                </div>
              </div>
              <div className="col-7">
                <div className="navIcons d-flex align-items-center justify-content-end">
                  <div
                    className="pe-4 cursor"
                    style={{ backgroundColor: "inherit", position: "relative" }}
                  ></div>
                   <div
                    className="pe-4 ml-1"
                    style={{ backgroundColor: "inherit", marginLeft: "10px" }}
                  >
                    <span
                      style={{
                        cursor: "pointer",
                        fontSize: "16px",
                        textTransform: "capitalize",
                      }}
                    >
                      {adminData ? adminData?.name : "admin"}
                    </span>
                  </div>
                  <div className="cursor">
                    <Link
                      href="/owner"
                      style={{ backgroundColor: "inherit" }}
                    >
                      {admin?.image?.length > 0 && (
                        <img
                          src={ admin?.image}
                          alt="Image"
                          width={40}
                          height={40}
                          style={{
                            borderRadius: "5px",
                            border: "1px solid white",
                            objectFit: "cover",
                          }}
                          className="cursor"
                        />
                      )}
                    </Link>
                  </div>
                 
                </div>
              </div>
            </div>
              </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
