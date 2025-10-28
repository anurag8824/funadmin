"use-client";

import React, { useEffect, useState } from "react";
import { Box, Modal, Typography } from "@mui/material";
import html2canvas from "html2canvas";
import { closeDialog } from "../../store/dialogSlice";
import { useDispatch, useSelector } from "react-redux";
import ReactSelect from "react-select";
import Input from "../../extra/Input";
import Button from "../../extra/Button";
import { addHashTag, updateHashTag } from "../../store/hashTagSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { baseURL } from "@/util/config";
import { createReportSetting, updateReportSetting } from "@/store/settingSlice";


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
  // padding: "19px",
};

interface ErrorState {
  title: string;
}
const ReportReasonDialogue = () => {
  const { dialogue, dialogueData } = useSelector(
    (state: RootStore) => state.dialogue
  );
    

  const { alGiftCategory } = useSelector((state: RootStore) => state.gift);
  const dispatch = useAppDispatch();
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [mongoId, setMongoId] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [name, setName] = useState<string>("");
  const [title, setTittle] = useState<string>("");

  const [imagePath, setImagePath] = useState<any>(null);
  const [error, setError] = useState<ErrorState>({
    title: "",
  });

  useEffect(() => {
    if (dialogueData) {
      setTittle(dialogueData?.title);
    }
  }, [dialogue, dialogueData]);

  const handleCloseAddCategory = () => {
    setAddCategoryOpen(false);
    dispatch(closeDialog());
    localStorage.setItem("dialogueData", JSON.stringify(dialogueData));
  };

  useEffect(() => {
    setAddCategoryOpen(dialogue);
    setMongoId(dialogueData?._id);
  }, [dialogue]);

  const handleSubmit = () => {
    

    if (!title) {
      let error = {} as ErrorState;
      if (!title) {
        error.title = "title is required";
      }
      return setError({ ...error });
    } else {
      let payload: any;
      if (mongoId) {
        const reportReasonData = {
          title: title,
        };

        payload = {
          data: reportReasonData,
          reportReasonId: mongoId,
        };
        dispatch(updateReportSetting(payload));
      } else {
        payload = {
          title,
        };
        dispatch(createReportSetting(payload));
      }
    }

    dispatch(closeDialog());
  };

  return (
    <div>
      <Modal
        open={addCategoryOpen}
        onClose={handleCloseAddCategory}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="">
         
          <div className="model-header">
            <p className="m-0">
             {dialogueData ? "Edit Reason" : "Add Reason"}
            </p>
          </div>
          <div className="model-body">
          <form>
            <div className="row sound-add-box" style={{ overflowX: "hidden" }}>
              <div className="col-12 mt-2">
                <Input
                  label={"Title"}
                  name={"Title"}
                  placeholder={"Enter Title"}
                  value={title}
                  type={"text"}
                  errorMessage={error.title && error.title}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTittle(value);
                    if (!value) {
                      setError({
                        ...error,
                        title: "Title Is Required",
                      });
                    } else {
                      setError({
                        ...error,
                        title: "",
                      });
                    }
                  }}
                />
              </div>

              
            </div>
          </form>
          </div>

          <div className="model-footer">
                  <div className="p-3 d-flex justify-content-end">
                <Button
                  onClick={handleCloseAddCategory}
                  btnName={"Close"}
                  newClass={"close-model-btn"}
                />
                <Button
                  onClick={handleSubmit}
                  btnName={dialogueData ? "Update" : "Submit"}
                  type={"button"}
                  newClass={"submit-btn"}
                  style={{
                    borderRadius: "0.5rem",
                    width: "88px",
                    marginLeft: "10px",
                  }}
                />
              </div>
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default ReportReasonDialogue;
