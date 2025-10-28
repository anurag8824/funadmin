import React, { useEffect, useState } from "react";
import { Box, Modal, Typography } from "@mui/material";
import { closeDialog } from "../../store/dialogSlice";
import { useSelector } from "react-redux";
import Input from "../../extra/Input";
import Button from "../../extra/Button";
import { addSongCategory, updateSongCategory } from "../../store/songSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { baseURL } from "@/util/config";

const style: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  backgroundColor: "background.paper",
  borderRadius: "13px",
  border: "1px solid #C9C9C9",
  boxShadow: "24px",
  padding: "19px",
};

interface ErrorState {
  image: String;
  name: String;
}
const AcceptedDialog = () => {
  const { dialogue, dialogueData } = useSelector(
    (state: any) => state.dialogue
  );
 
  const dispatch = useAppDispatch();
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [mongoId, setMongoId] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [name, setName] = useState<string>("");
  const [imagePath, setImagePath] = useState<string>("");
  const [error, setError] = useState<ErrorState>({
    image: "",
    name: "",
  });

  useEffect(() => {
    if (dialogueData) {
      setMongoId(dialogueData._id);
      setName(dialogueData.name);
      setImagePath( dialogueData.image);
    }
    setAddCategoryOpen(dialogue);
  }, [dialogue, dialogueData]);

  const handleCloseAddCategory = () => {
    setAddCategoryOpen(false);
    dispatch(closeDialog());
    localStorage.setItem("dialogueData", JSON.stringify(dialogueData));
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files[0]) {
      setImage(event.target.files[0]);
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImagePath(reader.result as string);
      });
      reader.readAsDataURL(event.target.files[0]);
    }

    if (!event.target.files || !event.target.files[0]) {
      setError({
        ...error,
        image: "Image Is Required",
      });
    } else {
      setError({
        ...error,
        image: "",
      });
    }
  };

  const handleSubmit = () => {
    if (!name || !imagePath) {
      let error = {} as ErrorState;
      if (!name) error.name = "Name is required";
      if (!imagePath) error.image = "Image is required";
      return setError({ ...error });
    } else {
      let formData = new FormData();
      formData.append("name", name);
      if (image) formData.append("image", image);

      if (mongoId) {
        const payload: any = {
          data: formData,
          songCategoryId: mongoId,
        };
        dispatch(updateSongCategory(payload));
      } else {
        const payload: any = {
          data: formData,
        };
        dispatch(addSongCategory(payload));
      }

      dispatch(closeDialog());
    }
  };

  return (
    <div>
      <Modal
        open={addCategoryOpen}
        onClose={handleCloseAddCategory}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="create-channel-model">
          <Typography id="modal-modal-title" variant="h6" component="h2">
            {dialogueData ? "Edit Song Category" : "Add Song Category"}
          </Typography>
          <form>
            <div className="row sound-add-box">
              <div className="col-12 mt-2">
                <Input
                  label={"Name"}
                  name={"name"}
                  placeholder={"Enter Name..."}
                  value={name}
                  errorMessage={error.name && error.name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!e.target.value) {
                      setError({
                        ...error,
                        name: "Name Is Required",
                      });
                    } else {
                      setError({
                        ...error,
                        name: "",
                      });
                    }
                  }}
                />
              </div>
              <div className="col-12 mt-2">
                <Input
                  type={"file"}
                  label={"Sound Image"}
                  accept={"image/*"}
                  errorMessage={error.image && error.image}
                  onChange={handleFileUpload}
                />
                <p className="fw-medium m-0 text-danger" style={{fontSize : "small"}}>(Note: Accept .png, .jpg, .jpeg)</p>
              </div>
              <div className="col-12 d-flex">
                <div className="row">
                  {imagePath && (
                    <>
                      <img
                        height="150px"
                        width="150px"
                        alt="app"
                        src={imagePath}
                        style={{
                          boxShadow: "0 5px 15px 0 rgb(105 103 103 / 0%)",
                          borderRadius: 10,
                          marginTop: 10,
                          float: "left",
                          objectFit: "cover",
                        }}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 d-flex justify-content-end">
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
          </form>
        </Box>
      </Modal>
    </div>
  );
};

export default AcceptedDialog;
