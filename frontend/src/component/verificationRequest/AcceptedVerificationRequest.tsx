import React, { useEffect, useState } from "react";
import Searching from "../../extra/Searching";
import Table from "../../extra/Table";
import Pagination from "../../extra/Pagination";
import { useSelector } from "react-redux";
import { getVerificationRequest } from "../../store/verificationRequestSlice";
import dayjs from "dayjs";
import { RootStore, useAppDispatch } from "@/store/store";
import { baseURL } from "@/util/config";
import useClearSessionStorageOnPopState from "@/extra/ClearStorage";
import Image1 from "@/assets/images/1.jpg"
import { useRouter } from "next/router";
import NoImage from '../../assets/images/user.png'


const AcceptedVerificationRequest = () => {


  const router = useRouter();
  const { acceptedData, totalAcceptedData } = useSelector(
    (state: RootStore) => state.verificationRequest
  );

  const dispatch = useAppDispatch();

  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(20);
  const [search, setSearch] = useState<string>();
  useClearSessionStorageOnPopState("multiButton");

  useEffect(() => {
    let payload: any = {
      start: page,
      limit: size,
      type: "accepted",
    };
    dispatch(getVerificationRequest(payload));
  }, [page, size]);

  useEffect(() => {
    setData(acceptedData);
  }, [acceptedData]);

  

  const postReportTable = [
  
    
    {
      Header: "No",
      body: "no",
      Cell: ({ index }: { index: number }) => (
        <span className="  text-nowrap">{(page - 1) * size + index + 1}</span>
      ),
    },
    {
      Header: "User",
      body: "userName",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex align-items-center justify-content-center gap-4">
          <div
            style={{ width: "60px", textAlign: "center" }}
            onClick={() => {
              
              localStorage.setItem("postProfile", JSON.stringify(row));
              router.push({
                pathname: "/viewProfile",
                query: { id: row?.userId?._id ,type: "ViewFakeUser" },
              });
            }}
          >
            {row?.userId?.image && row?.userId?.image !== "" ? (
              <img
                src={
                  row?.userId?.image 
                   
                }
              onError={(e)=>{
                e.currentTarget.src = NoImage.src; 
              }}
                width="60px"
                height="60px"
                style={{ objectFit: "cover", marginRight: "10px" }}
              />
            ) : (
              <img
                src={Image1.src}
                width="60px"
                height="60px"
                style={{ objectFit: "cover", marginRight: "10px" }}
              />
            )}
          </div>
          <div style={{ width: "200px", textAlign: "start" }}>

            <span className="text-capitalize">{row?.userId?.name}</span>
          </div>

        </div>
      ),
    },
    {
      Header: "Profile Selfie",
      body: "profileSelfie",
      Cell: ({ row, index }: { row: any; index: number }) => (
        <img
          src={ row?.profileSelfie}
          width="60px"
          height="60px"
          style={{ objectFit: "cover" }}
        />
      ),
    },
    {
      Header: "Document",
      body: "document",
      Cell: ({ row, index }: { row: any; index: number }) => (
        <img
          src={ row?.document}
          width="60px"
          height="60px"
          style={{ objectFit: "cover" }}
        />
      ),
    },
    {
      Header: "Document Type",
      body: "documentType",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">{row?.nameOnDocument}</span>
      ),
    },

    {
      Header: "Accepted Date",
      body: "updatedAt",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">
          {row?.updatedAt ? dayjs(row?.updatedAt).format("DD MMMM YYYY") : ""}
        </span>
      ),
    },
  ];

  const handleFilterData = (filteredData: any) => {
    if (typeof filteredData === "string") {
      setSearch(filteredData);
    } else {
      setData(filteredData);
    }
  };

  const handlePageChange = (pageNumber: number) => {
    setPage(pageNumber);
  };

  const handleRowsPerPage = (value: number) => {
    setPage(1);
    setSize(value);
  };

  return (
    <>
      <div className="userPage p-0">
        <div className="user-table ">
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
              Accepted Verification Request
            </h5>
            </div>
            <Searching
              data={acceptedData}
              placeholder={"Search here"}
              type={"client"}
              setData={setData}
              onFilterData={handleFilterData}
              searchValue={search}
              actionShow={false}
            />
          </div>
          <div className="">
            <Table
              data={data}
              mapData={postReportTable}
              serverPerPage={size}
              serverPage={page}
              type={"server"}
            />
            <div className="">
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
          </div>
        </div>
      </div>
    </>
  );
};

export default AcceptedVerificationRequest;
