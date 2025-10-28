"use client";
import { getActiveInactiveUser } from "@/store/dashSlice";
import { useAppDispatch } from "@/store/store";
import { IconBrowserShare, IconClipboardList, IconListCheck, IconMusicStar, IconUserHeart, IconUsers, IconUserShield, IconVideo } from "@tabler/icons-react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import RootLayout from "../component/layout/Layout";
import NewTitle from "../extra/Title";
import {
  dashboardCount,
  getChartPost,
  getChartUser,
  getChartVideo,
} from "../store/dashSlice";

const Dashboard = (props) => {
  const {
    dashCount,
    chartAnalyticOfVideos,
    chartAnalyticOfPosts,
    chartAnalyticOfUsers,
    activeUser,
    inActiveUser,
    totalUser,
  } = useSelector((state: any) => state.dashboard);

  const router = useRouter();
  const dispatch = useAppDispatch();

  let label = [];
  let dataPost = [];
  let dataVideo = [];
  let dataUser = [];

  const [startDate, setStartDate] = useState<string>("All");
  const [endDate, setEndDate] = useState<string>("All");

  useEffect(() => {
    let payload: any = {
      startDate: startDate,
      endDate: endDate,
    };
    dispatch(dashboardCount(payload));
  }, [dispatch, startDate, endDate]);

  useEffect(() => {
    let payload: any = {
      startDate: startDate,
      endDate: endDate,
      type: "Post",
    };
    dispatch(getChartPost(payload));
  }, [dispatch, startDate, endDate]);

  useEffect(() => {
    let payload: any = {
      startDate: startDate,
      endDate: endDate,
      type: "Video",
    };
    dispatch(getChartVideo(payload));
  }, [dispatch, startDate, endDate]);

  useEffect(() => {
    let payload: any = {
      startDate: startDate,
      endDate: endDate,
      type: "User",
    };
    dispatch(getChartUser(payload));
  }, [dispatch, startDate, endDate]);

  useEffect(() => {
    let payload: any = {
      startDate: startDate,
      endDate: endDate,
    };
    dispatch(getActiveInactiveUser(payload));
  }, [dispatch, startDate, endDate]);

  chartAnalyticOfUsers?.forEach((data_: any) => {
    const newDate = data_?._id;
    if (newDate) {
      label?.push(newDate);
      dataUser?.push(data_?.count);
    }
  });

  chartAnalyticOfVideos?.forEach((data_: any) => {
    const newDate = data_?._id;
    if (newDate) {
      label?.push(newDate);
      dataVideo?.push(data_?.count);
    }
  });

  chartAnalyticOfPosts?.forEach((data_: any) => {
    const newDate = data_?._id;
    if (newDate) {
      label?.push(newDate);
      dataPost?.push(data_?.count);
    }
  });

  let labelSet: any = new Set(label);
  // Convert labelSet back to array and sort
  label = [...labelSet].sort(
    (a: any, b: any) => new Date(a).getTime() - new Date(b).getTime()
  );

  // Ensure all arrays have the same length and are aligned properly with labels
  const maxLength = label?.length;

  for (let i = 0; i < maxLength; i++) {
    if (dataUser[i] === undefined) {
      dataUser[i] = 0;
    }
    if (dataVideo[i] === undefined) {
      dataVideo[i] = 0;
    }
    if (dataPost[i] === undefined) {
      dataPost[i] = 0;
    }
  }

  const totalSeries = {
    labels: label,
    dataSet: [
      {
        name: "Total User",
        data: dataUser,
      },
      {
        name: "Total Video",
        data: dataVideo,
      },
      {
        name: "Total Short",
        data: dataPost,
      },
    ],
  };
  const optionsTotal: ApexOptions = {
    chart: {
      type: "area",
      stacked: false,
      height: "200px",
      zoom: {
        enabled: false,
      },
      toolbar: {
        show: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 0,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [20, 100, 100, 100],
      },
    },
    yaxis: {
      show: false,
    },
    xaxis: {
      categories: label,
      // rotate: 0,
      // rotateAlways: true,
      // minHeight: 50,
      // maxHeight: 100,
      labels: {
        offsetX: -4, // Adjust the offset vertically
        // fontSize: 10,
      },
    },

    tooltip: {
      shared: true,
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      offsetX: -10,
    },
    colors: ["#8B82FC", "#786D81", "#be73f6"],
  };

  const optionsGradient: ApexOptions = {
    chart: {
      height: 400,
      width: 200,
      type: "radialBar",
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: 0,
        endAngle: 365,
        hollow: {
          margin: 0,
          size: "55%",
          background: "#fff",
          image: undefined,
          imageOffsetX: 0,
          imageOffsetY: 0,
          position: "front",
          dropShadow: {
            enabled: false,
            top: 3,
            left: 0,
            blur: 4,
            opacity: 0.24,
          },
        },
        track: {
          background: "#8B82FC", // Change the background color here
          strokeWidth: "90%",
          margin: 0, // margin is in pixels
          dropShadow: {
            enabled: false,
            top: -3,
            left: 0,
            blur: 4,
            opacity: 0.35,
          },
        },
        dataLabels: {
          show: true,
          name: {
            show: true,
            fontFamily: undefined,
            fontWeight: 700,
            fontSize: "17px",
            color: "#404040",
            offsetY: -10,
          },
          value: {
            formatter: function (val: any) {
              return parseInt(val) + "%";
            },
            color: "#9B7FF8",
            fontWeight: 600,
            fontSize: "30px",
            show: true,
          },
        },
      },
    },
    labels: ["Active User"],
    fill: {
      type: "solid",
      colors: ["#be73f6"],
    },
    stroke: {
      lineCap: "round",
    },
    states: {
      hover: {
        filter: {
          type: "none", // Disables the hover effect
        },
      },
    },
  };

  // Log the chartAnalyticOfUsers array to check its contents

  // Function to check if a value is a valid number
  const isValidNumber = (value: any) =>
    typeof value === "number" && !isNaN(value);

  // Calculate activeUserData
  const activeUserData =
    chartAnalyticOfUsers?.reduce((acc, obj) => {
      const count = obj?.count;
      return isValidNumber(count) ? acc + count : acc;
    }, 0) || 0;

  // Calculate userData
  const userData =
    chartAnalyticOfUsers?.reduce((acc, obj) => {
      const count = obj?.count;
      return isValidNumber(count) ? acc + count : acc;
    }, 0) || 0;

  // Calculate percentage
  const percentage =
    activeUserData && userData ? (activeUserData / userData) * 100 : 0;

  // Create the series data
  const activePercentageofUser = activeUser
    ? (activeUser / totalUser) * 100
    : 0;
  const seriesGradient = [activePercentageofUser];

  const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

  const CustomeCard = ({ link, title, count, icon }) => {
    return (
      <div
        className="col-xl-3 col-sm-6 col-12 cursor-pointer"
        onClick={() => router.push(link)}
      >
        <div className="card">
          <div className="card-content cursor-pointer">
            <div className="card-body p-4">
              <div className="align-content-center d-flex justify-content-between media">
                <div className="media-body text-left">
                  <h3 className="warning">{count}</h3>
                  <span className="fw-medium">{title}</span>
                </div>
                <div className="align-self-center">{icon}</div>
              </div>
              <div className="progress mt-2 mb-0" style={{ height: 7 }}>
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: "50%" }}
                  aria-valuenow={50}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="dashboard " style={{ padding: "15px", marginTop: "0px" }}>
        <div className="dashboardHeader primeHeader !mb-0 !p-0">
          <h4 className="heading-dashboard fw-semibold d-block">Welcome Admin !</h4>
          {/* <h6 className="">Dashboard</h6> */}
          <NewTitle
            dayAnalyticsShow={true}
            setEndDate={setEndDate}
            setStartDate={setStartDate}
            startDate={startDate}
            endDate={endDate}
            titleShow={true}
            name={`Dashboard`}
          />
        </div>

        <div className="dashBoardMain px-4 mt-4">
          <div className="row dashboard-count-box mt-2">
            <CustomeCard
              link={"/userTable"}
              title={"Total User"}
              count={dashCount?.totalUsers ? dashCount?.totalUsers : 0}
              icon={
                <IconUsers
                  className=""
                  style={{
                    width: "48px",
                    height: "48px",
                    color: "#8A82FB",
                  }}
                />
              }
            />
            <CustomeCard
              link={"/userTable"}
              title={"Total Active User"}
              count={
                dashCount?.totalActiveUsers ? dashCount?.totalActiveUsers : 0
              }
              icon={
                <IconUserHeart
                  className=""
                  style={{
                    width: "48px",
                    height: "48px",
                    color: "#8A82FB",
                  }}
                />
              }
            />
            <CustomeCard
              link={"/userTable"}
              title={"Total Verified User"}
              count={
                dashCount?.totalVerifiedUsers
                  ? dashCount?.totalVerifiedUsers
                  : 0
              }
              icon={
                <IconUserShield
                  className=""
                  style={{
                    width: "48px",
                    height: "48px",
                    color: "#8A82FB",
                  }}
                />
              }
            />
            <CustomeCard
              link={"/verificationRequestTable"}
              title={"Total Verification Request"}
              count={
                dashCount?.totalVerificationRequests
                  ? dashCount?.totalVerificationRequests
                  : 0
              }
              icon={
                <IconListCheck
                  className=""
                  style={{
                    width: "48px",
                    height: "48px",
                    color: "#8A82FB",
                  }}
                />
              }
            />

            <CustomeCard
              link={"/postTable"}
              title={"Total Post"}
              count={dashCount?.totalPosts ? dashCount?.totalPosts : 0}
              icon={
                <IconBrowserShare
                  className=""
                  style={{
                    width: "48px",
                    height: "48px",
                    color: "#8A82FB",
                  }}
                />
              }
            />

            <CustomeCard
              link={"/videoTable"}
              title={"Total Video"}
              count={dashCount?.totalVideos ? dashCount?.totalVideos : 0}
              icon={
                <IconVideo
                  className=""
                  style={{
                    width: "48px",
                    height: "48px",
                    color: "#8A82FB",
                  }}
                />
              }
            />

            <CustomeCard
              link={"/songTable"}
              title={"Total Song"}
              count={dashCount?.totalSongs ? dashCount?.totalSongs : 0}
              icon={
                <IconMusicStar
                  className=""
                  style={{
                    width: "48px",
                    height: "48px",
                    color: "#8A82FB",
                  }}
                />
              }
            />

            <CustomeCard
              link={"/reportType"}
              title={"Total Report"}
              count={dashCount?.totalReports ? dashCount?.totalReports : 0}
              icon={
                <IconClipboardList
                  className=""
                  style={{
                    width: "48px",
                    height: "48px",
                    color: "#8A82FB",
                  }}
                />
              }
            />
          </div>
          <div className="dashboard-analytics">
            <h6>Data Analytics</h6>
            <div className="row dashboard-chart justify-content-between">
              <div
                className="col-lg-9 col-md-12 col-sm-12 mt-lg-0 mt-4 dashboard-chart-box"
                style={{ position: "relative" }}
              >
                <div
                  id="chart"
                  className="dashboard-user-count"
                  style={{ height: "100%" }}
                >
                  <div className="date-range-picker mb-2 pb-2"></div>
                  <div className="">
                    <Chart
                      options={optionsTotal}
                      series={
                        totalSeries.dataSet.length > 1
                          ? totalSeries.dataSet
                          : [{ data: [] }]
                      }
                      type="area"
                      height={450}
                    />
                  </div>
                  <span
                    style={{
                      position: "absolute",
                      top: "46%",
                      right: "40%",
                      fontWeight: "500",
                    }}
                  ></span>
                </div>
              </div>
              <div className="col-lg-3 col-md-12  col-sm-12 mt-3 mt-lg-0 dashboard-total-user">
                <div className="user-activity">
                  <div className="border-bottom p-3">
                  <h6 className="m-0">Total User Activity</h6>
                  </div>
                  <div
                    id="chart"
                    style={{ display: "flex", justifyContent: "center" }}
                    className="p-3"
                  >
                    <Chart
                      options={optionsGradient}
                      series={seriesGradient}
                      type="radialBar"
                      width={450}
                      height={"360px"}
                    />
                  </div>
                  <div className="p-3">

                  <div className="total-user-chart">
                    <span></span>
                    <h5>Total Active User</h5>
                  </div>
                  <div className="total-active-chart">
                    <span></span>
                    <h5>Total Block User</h5>
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

Dashboard.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default Dashboard;
