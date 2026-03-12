import Button from "@/extra/Button";
import Input from "@/extra/Input";
import Pagination from "@/extra/Pagination";
import Table from "@/extra/Table";
import ToggleSwitch from "@/extra/ToggleSwitch";
import EditIcon from "../../assets/icons/EditBtn.svg";
import AddIcon from "@mui/icons-material/Add";
import {
  activeWithdrawMethod,
  deleteWithdrawMethod,
  getSetting,
  getWithdrawMethod,
  updateSetting,
} from "@/store/settingSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import AddWithdrawDialogue from "./AddWithdrawDialogue";
import { openDialog } from "@/store/dialogSlice";
import Image from "next/image";
import { baseURL } from "@/util/config";
import useClearSessionStorageOnPopState from "@/extra/ClearStorage";
import { IconEdit } from "@tabler/icons-react";

const WithdrawSetting = () => {
  const { settingData, withdrawSetting } = useSelector(
    (state: RootStore) => state.setting
  );

  const { dialogueType } = useSelector((state: RootStore) => state.dialogue);
  



  const dispatch = useAppDispatch();
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [actionPagination, setActionPagination] = useState("delete");
  const [selectCheckData, setSelectCheckData] = useState([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [minWithdrawalRequestedCoin, setMinWithdrawalRequestedCoin] =
    useState();
  const [error, setError] = useState<any>({
    minWithdrawalRequestedCoin: "",
  });
  useClearSessionStorageOnPopState("multiButton");

  useEffect(() => {
    let payload: any = {};
    dispatch(getWithdrawMethod());
     dispatch(getSetting(payload));
  }, [dispatch]);

  useEffect(() => {
    setMinWithdrawalRequestedCoin(settingData?.minWithdrawalRequestedCoin);
  }, [settingData]);

  useEffect(() => {
    setData(withdrawSetting);
  }, [withdrawSetting]);

  const handleEdit = (row: any, type: any) => {

    dispatch(openDialog({ type: type, data: row }));
  };

  const withdrawTable = [
    {
      Header: "No",
      body: "name",
      Cell: ({ index }) => <span>{(page - 1) * size + index + 1}</span>,
    },

    {
      Header: "Image",
      body: "image",
      Cell: ({ row, index }) => (
        <img
          src={ row?.image}
          width="50px"
          height="auto"
          style={{ objectFit: "cover" }}
        />
      ),
    },
    {
      Header: "Name",
      body: "name",
      Cell: ({ row }) => <span className="text-capitalize">{row?.name}</span>,
    },
    {
      Header: "Details",
      body: "details",
      Cell: ({ row }) => (
        <span className="text-capitalize">
          <ul>
            {row?.details?.map((detail, index) => (
              <li>{detail}</li>
            ))}
          </ul>
        </span>
      ),
    },
    {
      Header: "Created date",
      body: "createdAt",
      Cell: ({ row }) => (
        <span className="text-capitalize">
          {row?.createdAt ? dayjs(row?.createdAt).format("DD MMMM YYYY") : ""}
        </span>
      ),
    },
    {
      Header: "Active",
      body: "isActive",
      Cell: ({ row }) => (
        <ToggleSwitch
          value={row?.isActive}
          onChange={() => handleIsActive(row)}
        />
      ),
    },
    {
      Header: "Action",
      body: "action",
      Cell: ({ row }) => (
        <div className="action-button">
          <Button
            btnIcon={
             <IconEdit className="text-secondary" />
            }
            onClick={() => handleEdit(row, "withdraw")}
          />
        </div>
      ),
    },
  ];

  const handleOpenNew = (type: any) => {
    dispatch(openDialog({ type: type }));
  };

  const handleSelectAll = (event: any) => {
    const checked = event.target.checked;
    setSelectAllChecked(checked);
    if (checked) {
      setSelectCheckData([...data]);
    } else {
      setSelectCheckData([]);
    }
  };

  const paginationSubmitButton = () => {
    const selectCheckDataGetId = selectCheckData?.map((item) => item?._id);
  };

  const handleIsActive = (row) => {

    

    const id = row?._id;

    dispatch(activeWithdrawMethod(id));
  };

  const handleSubmit = () => {
    
    const minWithdrawalRequestedCoinValue = parseInt(
      minWithdrawalRequestedCoin
    );

    if (minWithdrawalRequestedCoinValue <= 0) {
      let error: any = {};

      if (minWithdrawalRequestedCoin === "")
        if (minWithdrawalRequestedCoinValue <= 0)
          error.minWithdrawalRequestedCoin = "Amount Invalid !";

      return setError({ ...error });
    } else {
      let data: any = {
        minWithdrawalRequestedCoin: parseInt(minWithdrawalRequestedCoin),
      };

      let payload: any = {
        settingId: settingData?._id,
        data: data,
      };
      dispatch(updateSetting(payload));
    }
  };
  return (
    <>
      {dialogueType === "withdraw" && <AddWithdrawDialogue />}
      <div className="  userPage withdrawal-page p-0">
        <div className="row">
          <div className="col-12">
            <div className=" card1 " > 
              <div className="cardHeader">
                <div className=" align-items-center d-flex flex-wrap justify-content-between p-3">
                  <div>
                    <p className="m-0 fs-5 fw-medium">
                      Minimum Withdrawal Limit
                    </p>
                  </div>
                  <Button
                    btnName={"Submit"}
                    type={"button"}
                    onClick={handleSubmit}
                    newClass={"submit-btn"}
                    style={{
                      borderRadius: "0.5rem",
                      width: "88px",
                      marginLeft: "10px",
                    }}
                  />
                </div>
              </div>
              <div className="payment-setting-box p-3">
                <div className="row">
                  <div className="col-12 withdrawal-input mt-1">
                    <Input
                      label={"Minimum withdrawal coin for user"}
                      name={"minWithdrawalRequestedCoin"}
                      type={"number"}
                      value={minWithdrawalRequestedCoin}
                      errorMessage={
                        error.minWithdrawalRequestedCoin &&
                        error.minWithdrawalRequestedCoin
                      }
                     placeholder={"Minimum withdrawal coin for user"}
                      onChange={(e) => {
                        setMinWithdrawalRequestedCoin(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            minWithdrawalRequestedCoin: `Amount Is Required`,
                          });
                        } else {
                          return setError({
                            ...error,
                            minWithdrawalRequestedCoin: "",
                          });
                        }
                      }}
                    />
                    {/* <p>Minimum withdrawal coin the users can request</p> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className=" user-table real-user ">
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
                Withdraw Payment Method
              </h5>
            </div>
            <div className="new-fake-btn">
              <Button
                btnIcon={<AddIcon />}
                // newClass={"rounded"}
                btnName={"New"}
                onClick={() => handleOpenNew("withdraw")}
              />
            </div>
          </div>

          <Table
            data={data}
            mapData={withdrawTable}
            PerPage={size}
            Page={page}
            type={"client"}
            handleSelectAll={handleSelectAll}
            selectAllChecked={selectAllChecked}
          />
          <div className="">
            <Pagination
              type={"client"}
              activePage={page}
              rowsPerPage={size}
              userTotal={withdrawSetting?.length}
              setPage={setPage}
              setData={setData}
              data={data}
              actionShow={false}
              actionPagination={actionPagination}
              setActionPagination={setActionPagination}
              paginationSubmitButton={paginationSubmitButton}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default WithdrawSetting;
