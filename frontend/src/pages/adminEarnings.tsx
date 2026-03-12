import BannerDialogue from "@/component/banner/BannerDialogue";
import RootLayout from "@/component/layout/Layout";
import Button from "@/extra/Button";
import Pagination from "@/extra/Pagination";
import TrashIcon from "../assets/icons/trashIcon.svg";
import EditIcon from "../assets/icons/EditBtn.svg";
import Table from "@/extra/Table";
import Title from "@/extra/Title";
import ToggleSwitch from "@/extra/ToggleSwitch";
import { activeBanner, deleteBanner, getBanner } from "@/store/bannerSlice";
import { openDialog } from "@/store/dialogSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { warning } from "@/util/Alert";
import { baseURL } from "@/util/config";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getAdminEarning } from "@/store/adminEarningSlice";
import NewTitle from "../extra/Title";
import Verified from "../assets/images/verified.png";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { getDefaultCurrency } from "@/store/currencySlice";
// import { useNavigate } from "react-router-dom";
import noImage from "../assets/images/user.png";

interface BannerData {
  _id: string;
  image: string;
  isActive: false;
}

const AdminEarnings = () => {
  // const navigate = useNavigate();
  const router = useRouter();

  const { adminEarnings, totalEarning } = useSelector(
    (state: RootStore) => state.adminEarning
  );
  const [startDate, setStartDate] = useState<string | Date>("All");
  const [endDate, setEndDate] = useState<string | Date>("All");
  const [showURLs, setShowURLs] = useState([]);
  const { currency } = useSelector((state: any) => state.currency);

  const startDateFormat = (startDate: string | Date): string => {
    return startDate && dayjs(startDate).isValid()
      ? dayjs(startDate).format("YYYY-MM-DD")
      : "All";
  };

  const endDateFormat = (endDate: string | Date): string => {
    return endDate && dayjs(endDate).isValid()
      ? dayjs(endDate).format("YYYY-MM-DD")
      : "All";
  };

  const dispatch = useAppDispatch();

  const [data, setData] = useState<any[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(20);
  const [page, setPage] = useState<any>(1);
  const [size, setSize] = useState(20);

  useEffect(() => {
    const payload = {
      startDate,
      endDate,
      page,
      size,
    };
    dispatch(getAdminEarning(payload));
  }, [dispatch, startDate, endDate, page, size]);

  useEffect(() => {
    dispatch(getDefaultCurrency());
  }, []);

  useEffect(() => {
    setData(adminEarnings);
  }, [adminEarnings]);

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleDeleteBanner = (row: any) => {
    const data = warning();
    data
      .then((res) => {
        if (res) {
          dispatch(deleteBanner(row?._id));
        }
      })
      .catch((err) => console.log(err));
  };

  const handleOpen = (row) => {
    router.push("/CoinPlanHistory");
    localStorage.setItem("adminEarningHistoryData", JSON.stringify(row));
  };

  const earningTable = [
    {
      Header: "No",
      body: "no",
      Cell: ({ index }) => (
        <span className="  text-nowrap">
          {(page - 1) * size + parseInt(index) + 1}
        </span>
      ),
    },
    {
      Header: "User Name",
      body: "fullName",
      Cell: ({ row, index }) => (
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ cursor: "pointer" }}
        >
          <div style={{ width: "60px", textAlign: "center" }}>
            <img src={ row?.image} width="40px" height="40px"  onError={(e)=>{
                        e.currentTarget.src = noImage.src;
                      }} />
          </div>
          <div style={{ width: "200px", textAlign: "start" }}>
            <span className="text-capitalize   cursorPointer text-nowrap">
              {row?.userName}
            </span>
          </div>
        </div>
      ),
    },

    {
      Header: "Total Plan Purchased",
      body: "totalPlansPurchased",
      Cell: ({ row }) => (
        <span className="text-capitalize">{row?.totalPlansPurchased}</span>
      ),
    },

    {
      Header: `Total Amount (${currency?.symbol})`,
      body: "totalAmountSpent",
      Cell: ({ row }) => (
        <span className="text-capitalize">{row?.totalAmountSpent}</span>
      ),
    },
    {
      Header: "Created At",
      body: "createdAt",
      Cell: ({ row }) => (
        <span className="text-capitalize">
          {dayjs(row.createdAt).format("MM/DD/YYYY")}
        </span>
      ),
    },

    {
      Header: "History",
      body: "history",
      Cell: ({ row }) => (
        <button
          onClick={() => handleOpen(row)}
          style={{ border: "none", outline: "none" }}
        >
          <svg
            fill="#000000"
            width="25px"
            height="25px"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M11.998 2.5A9.503 9.503 0 003.378 8H5.75a.75.75 0 010 1.5H2a1 1 0 01-1-1V4.75a.75.75 0 011.5 0v1.697A10.997 10.997 0 0111.998 1C18.074 1 23 5.925 23 12s-4.926 11-11.002 11C6.014 23 1.146 18.223 1 12.275a.75.75 0 011.5-.037 9.5 9.5 0 009.498 9.262c5.248 0 9.502-4.253 9.502-9.5s-4.254-9.5-9.502-9.5z" />
            <path d="M12.5 7.25a.75.75 0 00-1.5 0v5.5c0 .27.144.518.378.651l3.5 2a.75.75 0 00.744-1.302L12.5 12.315V7.25z" />
          </svg>
        </button>
      ),
    },
  ];

  return (
    <>
      <div className={`userTable`} style={{ padding: "20px" }}>
        <div className="dashboardHeader primeHeader mb-3 p-0">
          <NewTitle
            dayAnalyticsShow={true}
            setEndDate={setEndDate}
            setStartDate={setStartDate}
            startDate={startDate}
            endDate={endDate}
            titleShow={true}
            // name={`Order History`}
            //  setMultiButtonSelect={setMultiButtonSelect}
            //  multiButtonSelect={multiButtonSelect}
            //  labelData={["Real User", "Verified User", "Fake User"]}
          />
        </div>

        <div className=" user-table">
          <div className="user-table-top">
            <div className="w-100">
              <h5
                style={{
                  fontWeight: "500",
                  fontSize: "20px",
                  marginTop: "5px",
                  marginBottom: "4px",
                }}
              >
                Order History Table
              </h5>
            </div>
            <div className="col-12 col-sm-6 col-md-6 col-lg-6 mt-2 m-sm-0 new-fake-btn d-flex justify-content-end">
              <h4
                className="text-success"
                style={{
                  fontWeight: "500",
                  fontSize: "15px",
                  marginTop: "5px",
                  marginBottom: "4px",
                }}
              >
                Total Order History : {totalEarning}
              </h4>
            </div>
          </div>
          <Table
            data={data}
            mapData={earningTable}
            PerPage={size}
            Page={page}
            type={"client"}
          />
          <div className="mt-3 text-red-100">
            <Pagination
              type={"client"}
              activePage={page}
              rowsPerPage={size}
              userTotal={data?.length}
              setPage={setPage}
              setData={setData}
              data={data}
              actionShow={false}
            />
          </div>
        </div>
      </div>
    </>
  );
};
AdminEarnings.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};
export default AdminEarnings;
