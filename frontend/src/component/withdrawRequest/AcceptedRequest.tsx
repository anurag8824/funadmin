import useClearSessionStorageOnPopState from "@/extra/ClearStorage";
import Pagination from "@/extra/Pagination";
import Table from "@/extra/Table";
import { getDefaultCurrency } from "@/store/currencySlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { getwithdrawRequest } from "@/store/withdrawRequestSlice";
import { baseURL } from "@/util/config";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import userImage from "../../assets/images/8.jpg";
import noImage from "../../assets/images/user.png";


const AcceptedRequest = (props) => {
  const { acceptedData, totalAcceptedData } = useSelector(
    (state: RootStore) => state.withdrawRequest
  );

  const { currency } = useSelector((state: RootStore) => state.currency);

  const dispatch = useAppDispatch();

  const { startDate, endDate } = props;

  const [page, setPage] = useState(1);
  const [showURLs, setShowURLs] = useState([]);

  const [size, setSize] = useState(20);
  const [data, setData] = useState([]);
  const [defaultCurrency, setDefaultCurrency] = useState<any>({});
  useClearSessionStorageOnPopState("multiButton");

  useEffect(() => {
    let payload: any = {
      type: 2,
      start: page,
      limit: size,
      startDate: startDate,
      endDate: endDate,
    };
    dispatch(getwithdrawRequest(payload));
    dispatch(getDefaultCurrency());
  }, [dispatch, page, size, startDate, endDate]);

  useEffect(() => {
    setData(acceptedData);
    setDefaultCurrency(currency);
  }, [acceptedData, currency]);

  const handlePageChange = (pageNumber) => {
    setPage(pageNumber);
  };

  const handleRowsPerPage = (value) => {
    setPage(1);
    setSize(value);
  };

  const ManageUserData = [
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
      Header: "Username",
      body: "userName",
      Cell: ({ row, index }) => (
        <div
          className="d-flex align-items-center "
          style={{ cursor: "pointer" }}
        >
          <img
            src={row?.userId?.image === "" ? userImage?.src : row?.userImage}
            width="40px"
            height="40px"
            onError={(e)=>{
                                    e.currentTarget.src = noImage.src;
                                  }}
          />
          <span className="text-capitalize ms-3  cursorPointer text-nowrap">
            {row?.userId?.name}
          </span>
        </div>
      ),
    },
    {
      Header: `Request amount(${
        defaultCurrency?.symbol ? defaultCurrency?.symbol : ""
      })`,
      body: "requestAmount",
      Cell: ({ row }) => (
        <span className="text-lowercase cursorPointer">{row?.amount}</span>
      ),
    },
    {
      Header: "Coin",
      body: "coin",
      Cell: ({ row }) => <span>{row?.coin}</span>,
    },
    {
      Header: "Paymentgateway",
      body: "paymentGateway",
      Cell: ({ row }) => <span>{row?.paymentGateway}</span>,
    },
    {
      Header: "Date",
      body: "createdAt",
      Cell: ({ row }) => <span>{row?.requestDate}</span>,
    },
  ];

  return (
    <>
      <div className="user-table real-user mb-3">
        <div className="user-table-top">
          <h5
            style={{
              fontWeight: "500",
              fontSize: "20px",
              marginBottom: "5px",
              marginTop: "5px",
            }}
          >
            Accepted Withdraw Request
          </h5>
        </div>
        <Table
          data={data}
          mapData={ManageUserData}
          serverPerPage={size}
          serverPage={page}
          type={"server"}
        />
        <Pagination
          type={"server"}
          activePage={page}
          rowsPerPage={size}
          userTotal={totalAcceptedData}
          setPage={setPage}
          handleRowsPerPage={handleRowsPerPage}
          handlePageChange={handlePageChange}
        />
      </div>
    </>
  );
};

export default AcceptedRequest;
