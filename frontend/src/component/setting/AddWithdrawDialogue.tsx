import Button from "@/extra/Button";
import Input from "@/extra/Input";
import { uploadFile } from "@/store/adminSlice";
import { closeDialog } from "@/store/dialogSlice";
import {
  createWithdrawMethod,
  updateWithdrawMethod,
} from "@/store/settingSlice";
import { RootStore, useAppDispatch } from "@/store/store";


import { projectName } from "@/util/config";
import { Box, Modal, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  bgcolor: "background.paper",
  borderRadius: "5px",
  border: "1px solid #C9C9C9",
  boxShadow: 24,
};
interface ErrorState {
  name: string;
  image: string;
  detail: string;
}

const AddWithdrawDialogue = () => {
  const { dialogue, dialogueData } = useSelector(
    (state: RootStore) => state.dialogue
  );

    

  const [addCategory, setAddCategory] = useState(false);
  const [name, setName] = useState();
  const [imagePath, setImagePath] = useState<any>();
  const [image, setImage] = useState<any>();
  const [detail, setDetail] = useState("");
  const [error, setError] = useState({
    name: "",
    image: "",
    detail: "",
  });

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (dialogue) {
      setAddCategory(dialogue);
    }
  }, [dialogue]);
  useEffect(() => {
    if (dialogueData) {
      setName(dialogueData?.name);
      setImagePath(dialogueData?.image);
      setDetail(dialogueData?.details);
    }
  }, [dialogue, dialogueData]);

  const handleCloseAddCategory = () => {
    setAddCategory(false);
    dispatch(closeDialog());
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage([e.target.files[0]]);
      setImagePath(URL.createObjectURL(e.target.files[0]));
    }
  };


  let folderStructure: string = `${projectName}/admin/withdrawImage`;

  const handleFileUpload = async (image: any) => {


    // // Get the uploaded file from the event
    const file = image[0];
    const formData = new FormData();

    formData.append("folderStructure", folderStructure);
    formData.append("keyName", file.name);
    formData.append("content", file);

    // Create a payload for your dispatch
    const payloadformData: any = {
      data: formData,
    };

    if (formData) {
      const response: any = await dispatch(uploadFile(payloadformData)).unwrap();

      if (response?.data?.status) {

        if (response.data.url) {
          setImage(response.data.url);
          setImagePath(response.data.url);

          return response.data.url
        }
      }
    }
  };

  const handleSubmit = async () => {

    

    if (!name || (dialogueData ? "" : !image) || !detail) {
      let error = {} as ErrorState;
      if (!name) error.name = "Name Is Required !";
      if (!image) error.image = "Image Is Required !";
      if (!detail) error.detail = "Detail Is Required !";
      return setError({ ...error });
    } else {

      let url

      if (!dialogueData) {
        url = await handleFileUpload(image)
      } else if (image) {
        url = await handleFileUpload(image)
      }

      let payloadData: any = {
        name: name,
        image: url,
        details: detail,
      }

      if (dialogueData) {
        let payload: any = {
          data: payloadData,
          id: dialogueData?._id,
        };
        dispatch(updateWithdrawMethod(payload));
      } else {
        let payload: any = {
          name: name,
          image: url,
          details: detail,
          id: dialogueData?._id,
        };
        dispatch(createWithdrawMethod(payload));
      }
      handleCloseAddCategory();
    }
  };
  return (
    <>
      <Modal
        open={addCategory}
        onClose={handleCloseAddCategory}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="">
         
          <div className="model-header">
            <p className="m-0">
              {dialogueData
                ? "Update Payment Gateway"
                : "Create Payment Gateway"}
            </p>
          </div>

          <div className="model-body">
          <form>
            <Input
              label={"Name"}
              name={"name"}
              placeholder={"Enter Details..."}
              value={name}
              errorMessage={error.name && error.name}
              onChange={(e) => {
                setName(e.target.value);
                if (!e.target.value) {
                  return setError({
                    ...error,
                    name: `Name Is Required`,
                  });
                } else {
                  return setError({
                    ...error,
                    name: "",
                  });
                }
              }}
            />
            <div className="mt-2 add-details">
              <Input
                label={"Detail"}
                name={"detail"}
                placeholder={"Enter Details..."}
                value={detail}
                onChange={(e) => {
                  setDetail(e.target.value);
                  if (!e.target.value) {
                    return setError({
                      ...error,
                      detail: `Details Is Required`,
                    });
                  } else {
                    return setError({
                      ...error,
                      detail: "",
                    });
                  }
                }}
              />
            </div>
            <div>
              <span style={{ color: "red" }}>Note : Enter details Coma (,) separated string.</span>

              {error?.detail && <p className="errorMessage">{error?.detail}</p>}
            </div>
            <div className="mt-2 ">
              <Input
                type={"file"}
                label={"Image"}
                accept={"image/png, image/jpeg"}
                errorMessage={error.image && error.image}
                onChange={handleImage}
              />
            </div>
            <div className=" mt-2 fake-create-img mb-2">
              {imagePath && (
                <img
                  src={imagePath}
                  style={{ width: "96px", height: "auto" }}
                />
              )}
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
                btnName={"Submit"}
                type={"button"}
                newClass={"submit-btn"}
                style={{
                  borderRadius: "0.5rem",
                  width: "80px",
                  marginLeft: "10px",
                }}
              />
            </div>
          </div>
        </Box>
      </Modal>
    </>
  );
};

export default AddWithdrawDialogue;
