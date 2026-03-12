import Button from "@/extra/Button";
import Input from "@/extra/Input";
import Pagination from "@/extra/Pagination";
import Table from "@/extra/Table";
import { getDefaultCurrency } from "@/store/currencySlice";
import { RootStore, useAppDispatch } from "@/store/store";
import {
  deleteSupportRequest,
  getSupportRequest,
  supportRequestAccept,
} from "@/store/supportSlice";
import {
  getwithdrawRequest,
  withdrawRequestAccept,
  withdrawRequestDecline,
} from "@/store/withdrawRequestSlice";
import {
  warning,
  warningForAccept,
  warningForText,
} from "@/util/Alert";
import { baseURL } from "@/util/config";
import { Box, Modal, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import CustomButton from "@/extra/Button";
import Image from "next/image";
import TrashIcon from "../../assets/icons/trashIcon.svg";
import noImage from "../../assets/images/noImage.png";
import infoImage from "@/assets/images/info.svg";
import { IconCircleDashedCheck, IconInfoCircle, IconTrash } from "@tabler/icons-react";

const style: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  backgroundColor: "background.paper",
  borderRadius: "5px",
  border: "1px solid #C9C9C9",
  boxShadow: "24px",
};
interface ErrorState {
  reason: string;
}
const PendingSupportRequest = (props: any) => {
  const { pendingData, totalPendingData } = useSelector(
    (state: RootStore) => state.support
  );


  const { currency } = useSelector((state: RootStore) => state.currency);

  const dispatch = useAppDispatch();

  const { startDate, endDate } = props;

  const [page, setPage] = useState(1);
  const [openReason, setOpenReason] = useState(false);
  const [openInfo, setOpenInfo] = useState(false);
  const [infoData, setInfodata] = useState<any>();
  const [size, setSize] = useState(20);
  const [data, setData] = useState([]);

  

  useEffect(() => {
    let payload: any = {
      status: 1,
      startDate,
      endDate,
    };
    dispatch(getSupportRequest(payload));
  }, [dispatch, startDate, endDate]);

  useEffect(() => {
    setData(pendingData);
  }, [pendingData, currency]);

  const handlePageChange = (pageNumber) => {
    setPage(pageNumber);
  };

  const handleRowsPerPage = (value) => {
    setPage(1);
    setSize(value);
  };

  const handleOpenInfo = (row) => {
    setOpenInfo(true);
    setInfodata(row);
  };

  const handleDeleteSupportRequest = (id: any) => {
    
    const data = warning();
    data
      .then((res) => {
        if (res) {
          dispatch(deleteSupportRequest(id));
        }
      })
      .catch((err) => console.log(err));
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
      Header: "UniqueId",
      body: "uniqueId",
      Cell: ({ row }) => <span>{row?.uniqueId}</span>,
    },

    {
      Header: "Name",
      body: "name",
      Cell: ({ row, index }) => (
        <div className="" style={{ cursor: "pointer" }}>
          <img src={ row?.userImage} width="40px" height="40px" />
          <span className="text-capitalize ms-3  cursorPointer text-nowrap">
            {row?.name}
          </span>
        </div>
      ),
    },
    {
      Header: "Date",
      body: "createdAt",
      Cell: ({ row }) => <span>{row?.date.split(",")[0]}</span>,
    },

    {
      Header: "Time",
      body: "time",
      Cell: ({ row }) => <span>{row?.date.split(",")[1]}</span>,
    },

    {
      Header: "Info",
      body: "",
      Cell: ({ row }) => (
        <div className="action-button">

          <Button
             btnIcon={<IconInfoCircle className="text-secondary" />}
              newClass={`fw-bolder text-white`}
              onClick={() => handleOpenInfo(row)}
          />
        </div>
        // <img
        //   src={infoImage.src}
        //   alt="Info"
        //   onClick={() => handleOpenInfo(row)}
        // />
      ),
    },

    {
      Header: "Action",
      body: "action",
      Cell: ({ row }) => (
        <div className="action-button">
          <Button
            btnIcon={<IconCircleDashedCheck className="text-secondary" />}
            newClass={`fw-bolder text-white`}
            onClick={() => handleEdit(row, "pay")}
          />
          <CustomButton
            btnIcon={<IconTrash className="text-secondary" />}
            onClick={() => handleDeleteSupportRequest(row?._id)}
          />
        </div>
      ),
    },
  ];

  const handleEdit = (row: any, type: any) => {
    
    const data = warningForAccept();
    data
      .then((res) => {
        if (res) {
          dispatch(supportRequestAccept(row?._id));
        }
      })
      .catch((err) => console.log(err));
  };

  const handleCloseReason = () => {
    setOpenReason(false);
  };

  const handleCloseInfo = () => {
    setOpenInfo(false);
  };

  return (
    <>
      {}
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
            Support Request Table
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
          userTotal={totalPendingData}
          setPage={setPage}
          handleRowsPerPage={handleRowsPerPage}
          handlePageChange={handlePageChange}
        />
      </div>

      {/* For a Info Dialog :- */}

      <Modal
        open={openInfo}
        onClose={handleCloseReason}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="">
          <div className="model-header">
            <p className="m-0">Support Info</p>
          </div>

          <div className="model-body">
            <form>
              <div
                className="row sound-add-box"
                style={{ overflowX: "hidden" }}
              >
                {pendingData?.length > 0 &&
                  pendingData?.map((info, index) => {
                    return (
                      <div className="col-12 mt-2">
                        <div className="col-12 mt-3 text-about">
                          <Input
                            type={"text"}
                            label={"Description"}
                            name={"description"}
                            value={info?.complaint}
                            newClass={`mt-3`}
                            readOnly
                          />
                        </div>

                        <div className="col-12 mt-1 text-about">
                          <Input
                            type={"text"}
                            label={"Contact number"}
                            name={"Contact number"}
                            value={info?.contact}
                            newClass={`mt-3`}
                            readOnly
                          />
                        </div>

                        <div className="col-12 mt-3 text-about">
                          <label>Image</label>
                          <img
                            src={
                              info?.image ?  info?.image : noImage.src
                            }
                            style={{
                              opacity:
                                info?.isComplaintImageRestricted === true
                                  ? 0.5
                                  : 1,
                            }}
                            width="80px"
                            height="80px"
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </form>
          </div>
          <div className="model-footer">
            <div className="p-3 d-flex justify-content-end">
              <Button
                onClick={handleCloseInfo}
                btnName={"Close"}
                newClass={"close-model-btn"}
              />
            </div>
          </div>
        </Box>
      </Modal>
    </>
  );
};

export default PendingSupportRequest;
