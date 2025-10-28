import Button from "@/extra/Button";
import Input from "@/extra/Input";
import { adminProfileUpdate, uploadFile } from "@/store/adminSlice";
import { createBanner, getBanner, updateBanner } from "@/store/bannerSlice";
import { closeDialog } from "@/store/dialogSlice";
import { RootStore, useAppDispatch } from "@/store/store";

import { projectName } from "@/util/config";
import { Box, Modal, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import NoImageUser from '../../assets/images/user.png'
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
  image: string;
  serviceId: string;
  type: string;
  url: string;
}
const BannerDialogue = () => {


  const { dialogue, dialogueData, dialogueType } = useSelector(
    (state: RootStore) => state.dialogue
  );

  useEffect(() => {
    const payload: any = {
      start: 0,
      limit: 100,
      search: "ALL",
    };
    dispatch(getBanner(payload));
  }, [0, 100, "ALL"]);

  const dispatch = useAppDispatch();
  const [image, setImage] = useState<any>();
  const [imagePath, setImagePath] = useState<any>();
  const [addCurrencyOpen, setAddCurrencyOpen] = useState(false);

  const [error, setError] = useState({
    image: "",
    type: "",
  });

  useEffect(() => {
    if (dialogue) {
      setAddCurrencyOpen(dialogue);
    }
  }, [dialogue]);

  useEffect(() => {
    if (dialogueData) {
      setImagePath(dialogueData?.image);
    }
  }, [dialogueData]);

  const handleCloseAddCurrency = () => {
    setAddCurrencyOpen(false);
    dispatch(closeDialog());
    localStorage.setItem("dialogueData", JSON.stringify(dialogueData));
  };

  let folderStructure: string = `${projectName}/admin/bannerImage`;

  const handleFileUpload = async (image) => {
    // Get the uploaded file from the event
    const file = image;
    const formData = new FormData();

    formData.append("folderStructure", folderStructure);
    formData.append("keyName", file[0]?.name);
    formData.append("content", file[0]);

    // Create a payload for your dispatch
    const payloadformData: any = {
      data: formData,
    };

    if (formData) {
      const response: any = await dispatch(
        uploadFile(payloadformData)
      ).unwrap();

      if (response?.data?.status) {

        if (response.data.url) {
          
          setImage(response.data.url);
          setImagePath(response.data.url);

          return response.data.url
        }
      }
    }
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage([e.target.files[0]]);
      setImagePath(URL.createObjectURL(e.target.files[0]));
    }
  };

  

  const handleSubmit = async (e: any) => {
    

    if (!image) {
      let error = {} as ErrorState;
      if (!image) error.image = "Image is required";
      return setError({ ...error });
    } else {

      const url = await handleFileUpload(image);


      let payload: any = {
        id: dialogueData?._id,
        image: url,
      };

      if (dialogueData) {
        dispatch(updateBanner(payload));
      } else {
        dispatch(createBanner(payload));
      }

      dispatch(closeDialog());
    }
  };

  return (
    <div>
      <Modal
        open={addCurrencyOpen}
        onClose={handleCloseAddCurrency}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="">
          <div className="model-header">
            <p className="m-0">
              {dialogueData ? "Edit Banner" : "Add Banner"}
            </p>
          </div>
          <div className="model-body">
            <form>
              <div
                className="row sound-add-box"
                style={{ overflowX: "hidden" }}
              >
                <Input
                  type={"file"}
                  label={"Image"}
                  accept={"image/png, image/jpeg"}
                  errorMessage={error.image && error.image}
                  onChange={handleImage}
                />
                <p className="fw-medium m-0 text-danger" style={{fontSize : "small"}}>(Note: Accept only .png and .jpg)</p>

                {imagePath && (
                  <div style={{ borderRadius: "10px" }}>
                    <img
                      src={imagePath}
                      className="mt-3 mb-2"
                      alt="image"
                      style={{ width: "300px", borderRadius: "10px" }}
                       onError={(e) => {
                            e.currentTarget.src = NoImageUser.src;
                          }}
                    />
                  </div>
                )}
              </div>
            </form>
          </div>
          <div className="model-footer">
            <div className="m-3 d-flex justify-content-end">
              <Button
                onClick={handleCloseAddCurrency}
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
                  width: "80px",
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

export default BannerDialogue;
