"use client";
import Logo from "../../assets/images/shorty-logo 1.png";

import "../../assets/js/custom";
import Navigator from "../../extra/Navigator";
import $ from "jquery";
import DownArrow from "../../assets/icons/DownArrow.svg";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { warning } from "@/util/Alert";
import { projectName } from "@/util/config";
import { color } from "html2canvas/dist/types/css/types/color";
import axios from "axios";
import {
  IconBrandStorybook,
  IconBrowserShare,
  IconCards,
  IconCurrencyRupee,
  IconDatabase,
  IconGift,
  IconHash,
  IconHelpOctagon,
  IconHistory,
  IconHome,
  IconLivePhoto,
  IconLogout,
  IconMoodTongueWink2,
  IconMusic,
  IconReport,
  IconSettings,
  IconUser,
  IconUserCircle,
  IconUserQuestion,
  IconUserScan,
  IconVideo,
} from "@tabler/icons-react";

const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  const handleLogout = () => {
    handleCloseFunction();
    const data = warning(null , "Are you sure you want to logout?");
    data
      .then((logout: any) => {
        if (logout) {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("admin");
          sessionStorage.removeItem("key");
          sessionStorage.removeItem("isAuth");
          axios.defaults.headers.common["Authorization"] = "";
          router.push("/", { scroll: true });
        }
      })
      .catch((err) => console.log(err));
  };

  const handleCloseFunction = () => {
    let dialogueData_ = {
      dialogue: false,
    };
    localStorage.setItem("dialogueData", JSON.stringify(dialogueData_));
    localStorage.removeItem("multiButton");
  };

  const generalArray = [
    {
      name: "Setting",
      path: "/settingPage",

      navIcon: <IconSettings />,
      onClick: handleCloseFunction,
    },
    {
      name: "Profile",
      path: "/owner",

      onClick: handleCloseFunction,
      navIcon: <IconUserCircle />,
    },

    {
      name: "Logout",
      navIcon: <IconLogout />,
      onClick: handleLogout,
    },
  ];

  const dashBoardList = [
    {
      name: "Dashboard",
      path: "/dashboard",
      navIcon: <IconHome />,
      onClick: handleCloseFunction,
    },
  ]

  const contentList = [
     {
      name: "Banner",
      path: "/banner",
      navIcon: <IconCards />,
      onClick: handleCloseFunction,
    },
    {
      name: "Gift",
      path: "/giftPage",
      onClick: handleCloseFunction,
      navIcon: <IconGift />,
    },
    
    {
     name: "Reaction",
     path: "/reactions",
     navIcon: <IconMoodTongueWink2 />,
     onClick: handleCloseFunction,
   },
    {
      name: "Hashtag",
      path: "/hashTagTable",
      navIcon: <IconHash />,
      onClick: handleCloseFunction,
    },
  ]

  const userList = [
     {
      name: "User",
      path: "/userTable",
      path2: "/viewProfile",
      navIcon: <IconUser />,

      onClick: handleCloseFunction,
    },
    {
      name: "Verification Request",
      path: "/verificationRequestTable",
      navIcon: <IconUserScan />,
      onClick: handleCloseFunction,
    },
  ]

  const financeList = [
    {
      name: "Currency",
      path: "/currency",
      navIcon: <IconCurrencyRupee />,
      onClick: handleCloseFunction,
    },
    {
      name: "Withdraw Request",
      path: "/withdrawRequest",
      navIcon: <IconUserQuestion />,
      onClick: handleCloseFunction,
    },
    
  ]

  const reportList = [
    {
      name: "Support Request",
      path: "/support",
      navIcon: <IconHelpOctagon />,
      onClick: handleCloseFunction,
    },
    {
      name: "Report",
      path: "/reportType",
      navIcon: <IconReport />,
      onClick: handleCloseFunction,
    },
  ]

  const packageList = [
    {
      name: "Coin Plan",
      path: "/coinPlan",
      navIcon: <IconDatabase />,
      onClick: handleCloseFunction,
    },
    {
      name: "Order History",
      path: "/adminEarnings",
      path2: "/CoinPlanHistory",
      navIcon: <IconHistory />,
      onClick: handleCloseFunction,
    },
  ]

  const socialList = [
     {
      name: "Song",
      path: "/songTable",
      navIcon: <IconMusic />,
      onClick: handleCloseFunction,
    },
    {
      name: "Post",
      path: "/postTable",
      navIcon: <IconBrowserShare />,

      onClick: handleCloseFunction,
    },
    {
      name: "Story",
      path: "/story",
      navIcon: <IconBrandStorybook />,
      onClick: handleCloseFunction,
    },
    {
      name: "Videos",
      path: "/videoTable",
      navIcon: <IconVideo />,
      onClick: handleCloseFunction,
    },

    {
      name: "Live Video",
      path: "/liveVideo",
      navIcon: <IconLivePhoto />,
      onClick: handleCloseFunction,
    },
    
  ]

  const [totalPage, setTotalPage] = useState(20);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    if (mediaQuery?.matches) {
      $(".sideBar.mobSidebar").removeClass("mobSidebar");
      $(".sideBar").addClass("webSidebar");
    }
    $(".mobSidebar-bg").removeClass("responsive-bg");
  }, []);

  return (
    <>
      <Script totalPage={totalPage} />
      <div className="mainSidebar">
        <div className="sideBar webSidebar">
          <div className="sideBarLogo">
            <Link
              href="/admin/dashboard"
              className="d-flex align-items-center cursor-pointer"
            >
              <Image src={Logo} alt="logo" width={35} />
              <span
                className="fs-4 fw-semibold"
                style={{ color: "rgb(47 43 61 / 0.9)" }}
              >
                {projectName}
              </span>
            </Link>
          </div>
          {/* ======= Navigation ======= */}
          <div className="navigation">

            {/* Dashboard */}
            <p
              style={{
                fontSize: "15px",
                paddingLeft: "5px",
                fontWeight: "400",
                boxSizing: "border-box",
                marginBottom: "10px",
                borderWidth: "0",
                borderStyle: "solid",
                borderColor: "#d8d3d3",
                textTransform: "uppercase",
              }}
              className="sideBarTitle"
            >
              Dashboard
            </p>
            <nav
              style={{
                borderRadius: "10px",
                color: "#997CFA",
              }}
            >
             
              {dashBoardList?.length > 0 && (
                <>
                  {dashBoardList.map((res: any) => {
                    return (
                      <>
                        <Navigator
                          name={res?.name}
                          path={res?.path}
                          path2={res?.path2}
                          navIcon={res?.navIcon}
                          navIconImg={res?.navIconImg}
                          navSVG={res?.navSVG}
                          onClick={res?.onClick && res?.onClick}
                        >
                          {res?.subMenu &&
                            res?.subMenu?.map((subMenu: any) => {
                              return (
                                <Navigator
                                  subName={subMenu.subName}
                                  subPath={subMenu.subPath}
                                  subPath2={subMenu.subPath2}
                                  onClick={subMenu.onClick}
                                />
                              );
                            })}
                        </Navigator>
                      </>
                    );
                  })}
                </>
              )}
            </nav>


            {/* User Management */}
            <p
              style={{
                fontSize: "15px",
                paddingLeft: "5px",
                fontWeight: "400",
                boxSizing: "border-box",
                marginBottom: "10px",
                borderWidth: "0",
                borderStyle: "solid",
                borderColor: "#d8d3d3",
                textTransform: "uppercase",
              }}
              className="sideBarTitle"
            >
              User Management
            </p>
            <nav
              style={{
                borderRadius: "10px",
                color: "#997CFA",
              }}
            >
             
              {userList?.length > 0 && (
                <>
                  {userList.map((res: any) => {
                    return (
                      <>
                        <Navigator
                          name={res?.name}
                          path={res?.path}
                          path2={res?.path2}
                          navIcon={res?.navIcon}
                          navIconImg={res?.navIconImg}
                          navSVG={res?.navSVG}
                          onClick={res?.onClick && res?.onClick}
                        >
                          {res?.subMenu &&
                            res?.subMenu?.map((subMenu: any) => {
                              return (
                                <Navigator
                                  subName={subMenu.subName}
                                  subPath={subMenu.subPath}
                                  subPath2={subMenu.subPath2}
                                  onClick={subMenu.onClick}
                                />
                              );
                            })}
                        </Navigator>
                      </>
                    );
                  })}
                </>
              )}
            </nav>

{/* Content List */}
            <p
              style={{
                fontSize: "15px",
                paddingLeft: "5px",
                fontWeight: "400",
                boxSizing: "border-box",
                marginBottom: "10px",
                borderWidth: "0",
                borderStyle: "solid",
                borderColor: "#d8d3d3",
                textTransform: "uppercase",
              }}
              className="sideBarTitle"
            >
              Content Management
            </p>
            <nav
              style={{
                borderRadius: "10px",
                color: "#997CFA",
              }}
            >
             
              {contentList?.length > 0 && (
                <>
                  {contentList.map((res: any) => {
                    return (
                      <>
                        <Navigator
                          name={res?.name}
                          path={res?.path}
                          path2={res?.path2}
                          navIcon={res?.navIcon}
                          navIconImg={res?.navIconImg}
                          navSVG={res?.navSVG}
                          onClick={res?.onClick && res?.onClick}
                        >
                          {res?.subMenu &&
                            res?.subMenu?.map((subMenu: any) => {
                              return (
                                <Navigator
                                  subName={subMenu.subName}
                                  subPath={subMenu.subPath}
                                  subPath2={subMenu.subPath2}
                                  onClick={subMenu.onClick}
                                />
                              );
                            })}
                        </Navigator>
                      </>
                    );
                  })}
                </>
              )}
            </nav>
             {/* Social List */}
            <p
              style={{
                fontSize: "15px",
                paddingLeft: "5px",
                fontWeight: "400",
                boxSizing: "border-box",
                marginBottom: "10px",
                borderWidth: "0",
                borderStyle: "solid",
                borderColor: "#d8d3d3",
                textTransform: "uppercase",
              }}
              className="sideBarTitle"
            >
             Social Media
            </p>
            <nav
              style={{
                borderRadius: "10px",
                color: "#997CFA",
              }}
            >
             
              {socialList?.length > 0 && (
                <>
                  {socialList.map((res: any) => {
                    return (
                      <>
                        <Navigator
                          name={res?.name}
                          path={res?.path}
                          path2={res?.path2}
                          navIcon={res?.navIcon}
                          navIconImg={res?.navIconImg}
                          navSVG={res?.navSVG}
                          onClick={res?.onClick && res?.onClick}
                        >
                          {res?.subMenu &&
                            res?.subMenu?.map((subMenu: any) => {
                              return (
                                <Navigator
                                  subName={subMenu.subName}
                                  subPath={subMenu.subPath}
                                  subPath2={subMenu.subPath2}
                                  onClick={subMenu.onClick}
                                />
                              );
                            })}
                        </Navigator>
                      </>
                    );
                  })}
                </>
              )}
            </nav>

             

               {/* Finance List */}
            <p
              style={{
                fontSize: "15px",
                paddingLeft: "5px",
                fontWeight: "400",
                boxSizing: "border-box",
                marginBottom: "10px",
                borderWidth: "0",
                borderStyle: "solid",
                borderColor: "#d8d3d3",
                textTransform: "uppercase",
              }}
              className="sideBarTitle"
            >
             Finance
            </p>
            <nav
              style={{
                borderRadius: "10px",
                color: "#997CFA",
              }}
            >
             
              {financeList?.length > 0 && (
                <>
                  {financeList.map((res: any) => {
                    return (
                      <>
                        <Navigator
                          name={res?.name}
                          path={res?.path}
                          path2={res?.path2}
                          navIcon={res?.navIcon}
                          navIconImg={res?.navIconImg}
                          navSVG={res?.navSVG}
                          onClick={res?.onClick && res?.onClick}
                        >
                          {res?.subMenu &&
                            res?.subMenu?.map((subMenu: any) => {
                              return (
                                <Navigator
                                  subName={subMenu.subName}
                                  subPath={subMenu.subPath}
                                  subPath2={subMenu.subPath2}
                                  onClick={subMenu.onClick}
                                />
                              );
                            })}
                        </Navigator>
                      </>
                    );
                  })}
                </>
              )}
            </nav>
               {/* Packages */}
            <p
              style={{
                fontSize: "15px",
                paddingLeft: "5px",
                fontWeight: "400",
                boxSizing: "border-box",
                marginBottom: "10px",
                borderWidth: "0",
                borderStyle: "solid",
                borderColor: "#d8d3d3",
                textTransform: "uppercase",
              }}
              className="sideBarTitle"
            >
             Packages
            </p>
            <nav
              style={{
                borderRadius: "10px",
                color: "#997CFA",
              }}
            >
             
              {packageList?.length > 0 && (
                <>
                  {packageList.map((res: any) => {
                    return (
                      <>
                        <Navigator
                          name={res?.name}
                          path={res?.path}
                          path2={res?.path2}
                          navIcon={res?.navIcon}
                          navIconImg={res?.navIconImg}
                          navSVG={res?.navSVG}
                          onClick={res?.onClick && res?.onClick}
                        >
                          {res?.subMenu &&
                            res?.subMenu?.map((subMenu: any) => {
                              return (
                                <Navigator
                                  subName={subMenu.subName}
                                  subPath={subMenu.subPath}
                                  subPath2={subMenu.subPath2}
                                  onClick={subMenu.onClick}
                                />
                              );
                            })}
                        </Navigator>
                      </>
                    );
                  })}
                </>
              )}
            </nav>

              {/* Reports & Requests */}
            <p
              style={{
                fontSize: "15px",
                paddingLeft: "5px",
                fontWeight: "400",
                boxSizing: "border-box",
                marginBottom: "10px",
                borderWidth: "0",
                borderStyle: "solid",
                borderColor: "#d8d3d3",
                textTransform: "uppercase",
              }}
              className="sideBarTitle"
            >
            Reports & Requests
            </p>
            <nav
              style={{
                borderRadius: "10px",
                color: "#997CFA",
              }}
            >
             
              {reportList?.length > 0 && (
                <>
                  {reportList.map((res: any) => {
                    return (
                      <>
                        <Navigator
                          name={res?.name}
                          path={res?.path}
                          path2={res?.path2}
                          navIcon={res?.navIcon}
                          navIconImg={res?.navIconImg}
                          navSVG={res?.navSVG}
                          onClick={res?.onClick && res?.onClick}
                        >
                          {res?.subMenu &&
                            res?.subMenu?.map((subMenu: any) => {
                              return (
                                <Navigator
                                  subName={subMenu.subName}
                                  subPath={subMenu.subPath}
                                  subPath2={subMenu.subPath2}
                                  onClick={subMenu.onClick}
                                />
                              );
                            })}
                        </Navigator>
                      </>
                    );
                  })}
                </>
              )}
            </nav>

            {/* Genral */}
            <p
              style={{
                fontSize: "15px",
                paddingLeft: "5px",
                fontWeight: "400",
                boxSizing: "border-box",
                marginBottom: "10px",
                borderWidth: "0",
                borderStyle: "solid",
                borderColor: "#d8d3d3",
                textTransform: "uppercase",
              }}
              className="sideBarTitle"
            >
              General
            </p>
            <nav
              style={{
                borderRadius: "10px",
                color: "#997CFA",
              }}
            >
              {/* About */}
              {generalArray?.length > 0 && (
                <>
                  {(totalPage > 0
                    ? generalArray.slice(0, totalPage)
                    : generalArray
                  ).map((res: any) => {
                    return (
                      <>
                        <Navigator
                          name={res?.name}
                          path={res?.path}
                          path2={res?.path2}
                          navIcon={res?.navIcon}
                          navIconImg={res?.navIconImg}
                          navSVG={res?.navSVG}
                          onClick={res?.onClick && res?.onClick}
                        >
                          {res?.subMenu &&
                            res?.subMenu?.map((subMenu: any) => {
                              return (
                                <Navigator
                                  subName={subMenu.subName}
                                  subPath={subMenu.subPath}
                                  subPath2={subMenu.subPath2}
                                  onClick={subMenu.onClick}
                                />
                              );
                            })}
                        </Navigator>
                      </>
                    );
                  })}
                </>
              )}
            </nav>


            {/* <div
              className="boxCenter mt-2"
              onClick={() => setTotalPage(navBarArray.length)}
            >
              <Image
                src={DownArrow}
                alt="DownArrow"
                style={{ transition: "0.5s" }}
                className={`text-center mx-auto cursor ${
                  totalPage === navBarArray.length && "d-none"
                }`}
              />
            </div> */}
          </div>
        </div>
      </div>
      <div>{children}</div>
    </>
  );
};

export default Sidebar;

export const Script = (props: any) => {
  useEffect(() => {
    const handleClick = (event: any) => {
      const target = $(event.currentTarget);
      const submenu = target.next(".subMenu");

      $(".subMenu").not(submenu).slideUp();
      submenu.slideToggle();

      // Toggle rotation class on the clicked icon
      target.children("i").toggleClass("rotate90");

      // Remove rotation class from other icons
      $(".mainMenu > li > a > i")
        .not(target.children("i"))
        .removeClass("rotate90");
    };

    const handleToggle = () => {
      $(".mainNavbar").toggleClass("mobNav webNav");
      $(".sideBar").toggleClass("mobSidebar webSidebar");
      $(".comShow").toggleClass("mobCom webCom");
      $(".sideBarTitle").toggleClass("hidden");
      $(".sideBarLogo a").toggleClass("justify-content-center");

      // $(".mobSidebar-bg").toggleClass("responsive-bg ");
      $(".mainAdmin").toggleClass("mobAdmin");
      $(".fa-angle-right").toggleClass("rotated toggleIcon");

      var checkClass = $(".sideBar").hasClass("mobSidebar");
      if (checkClass) {
        var mobSidebarBg = document.querySelector(".mobSidebar-bg");
        mobSidebarBg && mobSidebarBg.classList.add("responsive-bg");
      } else {
        $(".mobSidebar-bg").removeClass("responsive-bg");
      }
    };
    $(".subMenu").hide();
    $(".mainMenu > li > a").on("click", handleClick);
    $(".navToggle").on("click", handleToggle);

    return () => {
      $(".mainMenu > li > a").off("click", handleClick);
      $(".navToggle").off("click", handleToggle);
    };
  }, [props.totalPage]);

  return null;
};
