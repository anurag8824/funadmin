import React, { useEffect, useState } from "react";
import NewTitle from "../extra/Title";
import Table from "../extra/Table";
import Pagination from "../extra/Pagination";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { getAdminEarning } from "@/store/adminEarningSlice";
import RootLayout from "@/component/layout/Layout";



const CoinPlanHistory = () => {
    const dispatch = useDispatch();
    // const coinPlanHistoryData = location?.state?.data;
    const [data, setData] = useState();
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(20);
    const [startDate, setStartDate] = useState("All");
    const [endDate, setEndDate] = useState("All");
    let adminEarningHistoryData = null;

    if (typeof window !== "undefined") {
      adminEarningHistoryData = JSON.parse(localStorage.getItem("adminEarningHistoryData")) || null;
    }
    





    // useEffect(() => {
    //     setData(coinPlanHistoryData?.coinPlanPurchase);
    // }, [coinPlanHistoryData?.coinPlanPurchase]);

    const handlePageChange = (pageNumber) => {
        setPage(pageNumber);
    };

    const handleRowsPerPage = (value) => {
        setPage(1);
        setSize(value);
    };

    const earningTable = [
        {
            Header: "NO",
            body: "no",
            Cell: ({ index }) => (
                <span className="  text-nowrap">
                    {(page - 1) * size + parseInt(index) + 1}
                </span>
            ),
        },


        {
            Header: "UNIQUEID",
            body: "uniqueId",
            Cell: ({ row }) => (
                <span className="text-capitalize">{row?.uniqueId}</span>
            ),
        },
        {
            Header: "COIN",
            body: "coin",
            Cell: ({ row }) => (
                <span className="text-capitalize">
                    {row?.coin}
                </span>
            ),
        },

        {
            Header: `AMOUNT`,
            body: "amount",
            Cell: ({ row }) => (
                <span className="text-capitalize">
                    {row?.amount}
                </span>
            ),
        },
        {
            Header: "PAYMENT GATEWAY",
            body: "paymentGateway",
            Cell: ({ row }) => (
                <span className="text-capitalize">{row?.paymentGateway}</span>
            ),
        },

    
        {
            Header: "CREATED AT",
            body: "createdAt",
            Cell: ({ row }) => (
                <span className="text-capitalize">
                    {dayjs(row.createdAt).format("MM/DD/YYYY")}
                </span>
            ),
        },

    ];

    return (
        <div className="userPage withdrawal-page">
            <div className="dashboardHeader primeHeader mb-3 p-0">
                <NewTitle
                    dayAnalyticsShow={false}
                    titleShow={true}
                    setEndDate={setEndDate}
                    setStartDate={setStartDate}
                    startDate={startDate}
                    endDate={endDate}
                    name={`Coin Plan Earning`}
                />
            </div>
            <div className="payment-setting-box user-table">
                <div className="row align-items-center mb-2 p-3 ml-1">
                    <div className="col-12 col-sm-6 col-md-6 col-lg-6">
                        <h5
                            style={{
                                fontWeight: "500",
                                fontSize: "20px",
                                marginBottom: "0px",
                                marginTop: "5px",
                                padding: "3px",
                            }}
                        >
                            Coin Plan Purchase History Table
                        </h5>
                    </div>
                    <div className="col-12 col-sm-6 col-md-6 col-lg-6 mt-2 m-sm-0 new-fake-btn d-flex justify-content-end">
                    </div>
                </div>
                <div className="mt-3">
                    <Table
                        data={adminEarningHistoryData?.coinPlanPurchase}
                        mapData={earningTable}
                        serverPerPage={size}
                        serverPage={page}
                        type={"server"}
                    />
                    <div className="mt-3">
                        <Pagination
                            type={"server"}
                            activePage={page}
                            actionShow={false}
                            rowsPerPage={size}
                            userTotal={adminEarningHistoryData?.coinPlanPurchase?.length}
                            setPage={setPage}
                            handleRowsPerPage={handleRowsPerPage}
                            handlePageChange={handlePageChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

CoinPlanHistory.getLayout = function getLayout(page: React.ReactNode) {
    return <RootLayout>{page}</RootLayout>;
};
export default CoinPlanHistory;
