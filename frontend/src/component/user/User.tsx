import React, { useEffect, useState } from "react";
import { connect, useSelector } from "react-redux";
import Pagination from "../../extra/Pagination";
import Table from "../../extra/Table";
import { openDialog } from "../../store/dialogSlice";
import Searching from "../../extra/Searching";
import ToggleSwitch from "../../extra/ToggleSwitch";
import { allUsers, blockUser } from "../../store/userSlice";
import { RootStore, useAppDispatch } from "../../store/store";
import { baseURL } from "@/util/config";
import { useRouter } from "next/router";
import useClearSessionStorageOnPopState from "@/extra/ClearStorage";
import Verified from "../../assets/images/verified.png";
import Image from "next/image";

import Button from "@/extra/Button";
import dayjs from "dayjs";
import { IconEye } from "@tabler/icons-react";
import NoImage from '../../assets/images/user.png';  
const User = (props) => {
  const { startDate, endDate } = props;
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [actionPagination, setActionPagination] = useState("block");
  const [selectCheckData, setSelectCheckData] = useState<any[]>([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [search, setSearch] = useState<string | undefined>();
  const { realUserData, totalRealUser } = useSelector(
    (state: RootStore) => state.user
  );
  
  const router = useRouter();
  useClearSessionStorageOnPopState("multiButton");

  const [data, setData] = useState<any>();

  useEffect(() => {
    setData(realUserData);
  }, [realUserData]);

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

    // dispatch(openDialog({ type: type, data: row }));

    // let dialogueData_ = {
    //   dialogue: true,
    //   type: type,
    //   dialogueData: row,
    // };

    // localStorage.setItem("postData", JSON.stringify(row));
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
    
    const isActiveData = realUserData?.filter((user) => {
      return (
        user.isBlock === false &&
        selectCheckData.some((ele) => ele._id === user._id)
      );
    });
    const deActiveData = realUserData?.filter((user) => {
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
    setSelectCheckData([]);
    setSelectAllChecked(false);
  };

  const handleRedirect = (row: any) => {
    // localStorage.setItem("postData", JSON.stringify(row));
    // localStorage.removeItem("multiButton");

    router.push({
      pathname: "/viewProfile",
      query: { id: row?._id },
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
      Header: "Name",
      body: "name",
      Cell: ({ row }) => (
        <div
          className="d-flex align-items-center "
          style={{ cursor: "pointer" }}
          onClick={() => handleEdit(row, "manageUser")}
        > 
          <img src={row?.image} width="50px" height="50px" onError={(e)=>{
                e.currentTarget.src = NoImage.src; 
              }} />
          <span className="text-capitalize  ms-3 cursorPointer text-nowrap">
            {row?.name}
          </span>

          {row?.isVerified == true ? (
            <Image
              src={Verified}
              alt="Edit Icon"
              className="ms-1"
              width={18}
              height={18}
              
            />
          ) : (
            ""
          )}
        </div>
      ),
    },
    {
      Header: "User name",
      body: "userName",
      Cell: ({ row }) => (
        <span className="text-lowercase cursorPointer">{row?.userName}</span>
      ),
    },
    {
      Header: "Unique ID",
      body: "id",
      Cell: ({ row }) => (
        <span className="text-capitalize    cursorPointer">
          {row?.uniqueId}
        </span>
      ),
    },
    {
      Header: "Gender",
      body: "id",
      Cell: ({ row }) => (
        <span className="text-capitalize    cursorPointer">{row?.gender}</span>
      ),
    },
    {
      Header: "Country",
      body: "country",
      Cell: ({ row }) => (
        <span className="text-capitalize cursorPointer">
          {row?.country || "-"}
        </span>
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
      Header: "Created date",
      body: "createdAt",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">
          {row?.createdAt ? dayjs(row?.createdAt).format("DD MMMM YYYY") : ""}
        </span>
      ),
    },

    {
      Header: "Preview",
      body: "Action",
      Cell: ({ row }) => (
        <>
         
          <div className="action-button">
            <Button
              btnIcon={<IconEye className="text-secondary" />}
              onClick={() => handleRedirect(row)}
            />
          </div>
        </>
      ),
    },
  ];

  useEffect(() => {
    const payload: any = {
      type: "realUser",
      start: page,
      limit: size,
      startDate,
      endDate,
    };
    dispatch(allUsers(payload));
  }, [startDate, endDate, page, size]);

  const handleIsActive = (row: any) => {
    const id = row?._id;
    const data = row?.isBlock === false ? true : false;

    const payload: any = { id, data };
    dispatch(blockUser(payload));
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
          <div style={{ width: "100%" }}>
            <h5
              style={{
                fontWeight: "500",
                fontSize: "20px",
                marginTop: "5px",
                marginBottom: "4px",
              }}
            >
              Real User
            </h5>
          </div>
          <Searching
            placeholder={"Search here"}
            data={realUserData}
            type={"client"}
            setData={setData}
            onFilterData={handleFilterData}
            searchValue={search}
            actionPagination={actionPagination}
            setActionPagination={setActionPagination}
            paginationSubmitButton={paginationSubmitButton}
            actionPaginationDataCustom={["Block", "Unblock"]}
            // actionShow={false}
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
          userTotal={totalRealUser}
          setPage={setPage}
          handleRowsPerPage={handleRowsPerPage}
          handlePageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default connect(null, { blockUser, allUsers })(User);
