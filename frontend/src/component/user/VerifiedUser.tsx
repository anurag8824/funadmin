import Pagination from "@/extra/Pagination";
import Searching from "@/extra/Searching";
import Table from "@/extra/Table";
import ToggleSwitch from "@/extra/ToggleSwitch";
import { RootStore, useAppDispatch } from "@/store/store";
import { allUsers, blockUser, blockVerifiedUser } from "@/store/userSlice";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Verified from "../../assets/images/verified.png";
import Image1 from "../../assets/images/8.jpg";

import useClearSessionStorageOnPopState from "@/extra/ClearStorage";
import { useRouter } from "next/router";

import NoImage from '../../assets/images/user.png'

const VerifiedUser = (props) => {
  useClearSessionStorageOnPopState("multiButton");
  const { startDate, endDate } = props;
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [actionPagination, setActionPagination] = useState("block");
  const [selectCheckData, setSelectCheckData] = useState<any[]>([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [search, setSearch] = useState<string | undefined>();
  const { verifiedUserData, totalVerifiedUser } = useSelector(
    (state: RootStore) => state.user
  );
    
 
  const [data, setData] = useState<any>();
  const [showURLs, setShowURLs] = useState<boolean[]>([]);
  useEffect(() => {
    const payload: any = {
      type: "verifiedUser",
      start: page,
      limit: size,
      startDate,
      endDate,
    };
    dispatch(allUsers(payload));
  }, [dispatch, startDate, endDate, page, size]);

  useEffect(() => {
    setData(verifiedUserData);
  }, [verifiedUserData]);

  const handlePageChange = (pageNumber: number) => {
    setPage(pageNumber);
  };

  const handleRowsPerPage = (value: number) => {
    setPage(1);
    setSize(value);
  };

  const handleEdit = (row: any, type: string) => {


    router.push({
      pathname: "/viewProfile",
      query: { id: row?._id },
    });

    localStorage.setItem("postData", JSON.stringify(row));
    localStorage.removeItem("multiButton");
  };

  const handleSelectCheckData = (
    e: React.ChangeEvent<HTMLInputElement>,
    row: any
  ) => {

    const checked = e.target.checked;
    if (checked) {
      setSelectCheckData((prevSelectedRows) => [...prevSelectedRows, row]);
    } else {
      setSelectCheckData((prevSelectedRows) =>
        prevSelectedRows.filter((selectedRow) => selectedRow._id !== row._id)
      );
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;

    setSelectAllChecked(checked);
    if (checked) {
      setSelectCheckData([...data]);
    } else {
      setSelectCheckData([]);
    }
  };

  const paginationSubmitButton = () => {
     
    const isActiveData = verifiedUserData?.filter((user) => {
      return (
        user.isBlock === false &&
        selectCheckData.some((ele) => ele._id === user._id)
      );
    });
    const deActiveData = verifiedUserData?.filter((user) => {
      return (
        user.isBlock === true &&
        selectCheckData.some((ele) => ele._id === user._id)
      );
    });
    const getId = isActiveData?.map((item) => item?._id);
    const getId_ = deActiveData?.map((item) => item?._id);
    if (actionPagination === "block") {
      const data = true;
      const payload: any = {
        id: getId,
        data: data,
      };
      
      dispatch(blockUser(payload));
    } else if (actionPagination === "unblock") {
      const data = false;
      const payload: any = {
        id: getId_,
        data: data,
      };
      dispatch(blockUser(payload));
    }
  };

  const handleRedirect = (row: any) => {
    localStorage.setItem("postData", JSON.stringify(row));
    router.push({
      pathname: "/viewProfile",
      query: { id: row?._id , type: "ViewFakeUser"},
    });
  };

  const ManageUserData = [
    {
      Header: "checkBox",
      width: "20px",
      Cell: ({ row }: { row: any }) => (
        <input
          type="checkbox"
          checked={selectCheckData.some(
            (selectedRow) => selectedRow?._id === row?._id
          )}
          onChange={(e) => handleSelectCheckData(e, row)}
        />
      ),
    },
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
      Header: "Unique id",
      body: "id",
      Cell: ({ row }) => (
        <span className="text-capitalize    cursorPointer">
          {row?.uniqueId}
        </span>
      ),
    },
    {
      Header: "User",
      body: "name",
      Cell: ({ row }) => (
        <div
          className="d-flex align-items-center "
          style={{ cursor: "pointer" }}
          onClick={() => handleEdit(row, "manageUser")}
        >
          <img
            src={row?.image !== "" ? row?.image : Image1.src}
            width="50px"
            height="50px"
             onError={(e)=>{
                e.currentTarget.src = NoImage.src; 
              }}
          />
          <span className="text-capitalize fw-bold ms-3 cursorPointer text-nowrap">
            {row?.name}
          </span>
          <img
            src={Verified.src}
            alt="Edit Icon"
            className="ms-1"
            width={18}
            height={18}
          />
        </div>
      ),
    },
    {
      Header: "User name",
      body: "userName",
      Cell: ({ row }) => (
        <span className="text-lowercase    cursorPointer">{row?.userName}</span>
      ),
    },

    {
      Header: "Block Status",
      body: "isActive",
      Cell: ({ row }) => (
        <ToggleSwitch
          value={row?.isBlock}
          onChange={() => handleIsActive(row)}
        />
      ),
    },

    {
      Header: "Preview",
      body: "Preview",
      Cell: ({ row }) => (
        <>
          <button
            className="viewbutton mx-auto"
            onClick={() => handleRedirect(row)}
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              stroke-linejoin="round"
              className="css-i6dzq1"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>View</span>
          </button>
        </>
      ),
    },
  ];

  const handleIsActive = (row: any) => {

    const id = row?._id;
    const data = row?.isBlock === false ? true : false;

    const payload: any = { id, data };
    dispatch(blockUser(payload));
    dispatch(blockVerifiedUser(payload));
  };

  const handleFilterData = (filteredData: string | any[]) => {
    if (typeof filteredData === "string") {
      setSearch(filteredData);
    } else {
      setData(filteredData);
    }
  };
  return (
    <div>
      <div className="user-table real-user mb-3">
        <div className="user-table-top">
            <div style={{  width: "100%" }}>

          <h5
            style={{
              fontWeight: "500",
              fontSize: "18px",
              marginBottom: "5px",
              marginTop: "5px",
            }}
          >
            Verified User
          </h5>
            </div>
          <Searching
            placeholder={"Search here"}
            data={verifiedUserData}
            type={"client"}
            setData={setData}
            onFilterData={handleFilterData}
            searchValue={search}
            actionPagination={actionPagination}
            setActionPagination={setActionPagination}
            paginationSubmitButton={paginationSubmitButton}
            actionPaginationDataCustom={["Block", "Unblock"]}
          />
        </div>
        <Table
          data={data}
          mapData={ManageUserData}
          serverPerPage={size}
          serverPage={page}
          handleSelectAll={handleSelectAll}
          selectAllChecked={selectAllChecked}
          type={"server"}
        />
        <Pagination
          type={"server"}
          activePage={page}
          rowsPerPage={size}
          userTotal={totalVerifiedUser}
          setPage={setPage}
          handleRowsPerPage={handleRowsPerPage}
          handlePageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default VerifiedUser;
