"use-client";
import React, { useEffect, useState, ChangeEvent } from "react";
import { useSelector } from "react-redux";
import {
  adminProfileGet,
  adminProfileUpdate,
  adminProfileUpdated,
  updateAdminPassword,
  uploadFile,
} from "../store/adminSlice";
import Input from "../extra/Input";
import EditIcon from "@mui/icons-material/Edit";
import Button from "../extra/Button";
import UserImage from "../assets/images/8.jpg";
import { RootStore, useAppDispatch } from "@/store/store";
import RootLayout from "@/component/layout/Layout";
import { projectName } from "@/util/config";

interface ErrorState {
  name: string;
  email: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const getAdminData =
  typeof window !== "undefined" && JSON.parse(sessionStorage.getItem("admin_"));
const Owner = () => {
  const { admin, imageUrl } = useSelector((state: RootStore) => state.admin);
  const dispatch = useAppDispatch();
  const [data, setData] = useState<any>();
  const [name, setName] = useState<string | undefined>();
  const [email, setEmail] = useState<string | undefined>();
  const [oldPassword, setOldPassword] = useState<string | undefined>();
  const [newPassword, setNewPassword] = useState<string | undefined>();
  const [confirmPassword, setConfirmPassword] = useState<string | undefined>();
  const [image, setShowImage] = useState<File[]>([]);
  const [imgApi, setImgApi] = useState();

  const [imagePath, setImagePath] = useState<string | undefined>();
  const [error, setError] = useState<ErrorState>({
    name: "",
    email: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const payload: any = {
      adminId: getAdminData?._id,
    };
    dispatch(adminProfileGet(payload));
  }, []);

  useEffect(() => {
    setData(admin);
  }, [admin]);

  useEffect(() => {
    setName(admin?.name);
    setEmail(admin?.email);
    setOldPassword(admin?.password);

    // Check if admin.image is falsy and assign the default image accordingly
    setImagePath(admin?.image);
  }, [admin]);      

  let folderStructure: string = `${projectName}/admin/adminImage`;

  const handleFileUpload = async (event: any) => {
    // // Get the uploaded file from the event
    const file = event.target.files[0];
    const formData = new FormData();

    formData.append("folderStructure", folderStructure);
    formData.append("keyName", file.name);
    formData.append("content", file);

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
          const payload: any = {
            image: response.data.url,
          };
          dispatch(adminProfileUpdate(payload));
          setShowImage(response.data.url);
          setImagePath(response.data.url);
        }
      }
    }
  };

  const handleEditProfile = () => {
    if (!email || !name) {
      const error = {} as ErrorState;
      if (!email) error.email = "Email Is Required!";
      if (!name) error.name = "Name Is Required!";
      return setError({ ...error });
    } else {
      const paylaod: any = {
        email,
        name,
      };

      const payload: any = {
        adminId: admin?._id,
        data: paylaod,
      };
      dispatch(adminProfileUpdated(payload));
    }
  };

  const handlePassword = () => {
    if (!newPassword || !oldPassword || !confirmPassword) {
      const error = {} as ErrorState;
      if (!newPassword) error.newPassword = "New Password Is Required!";
      if (!oldPassword) error.oldPassword = "Old Password Is Required!";
      if (!confirmPassword)
        error.confirmPassword = "Confirm Password Is Required!";
      return setError({ ...error });
    } else {
      if (newPassword !== confirmPassword) {
        setError({ ...error, confirmPassword: "Passwords do not match!" });
      }
      const payload = {
        adminId: admin?._id,
        data: {
          oldPass: oldPassword,
          newPass: newPassword,
          confirmPass: confirmPassword,
        },
      };
      dispatch(updateAdminPassword(payload));
    }
  };

  return (
  <div className="userPage">
      <div className="profile-page p-0 payment-setting card1">
        <div className="cardHeader">
                  <div className=" align-items-center d-flex flex-wrap justify-content-between p-3">
                      <div>
                        <p className="m-0 fs-5 fw-medium">
                          App Setting
                        </p>
                      </div>
                      
                    
                  </div>
                </div>
        <div className="payment-setting-box  p-3">
          <div className="row">
            <div className="col-lg-6 col-sm-12 ">
              <div className="mb-4 ">
                <div className="withdrawal-box  profile-img d-flex flex-column align-items-center">
                  <h6 className="text-start ">
                    Profile Avatar
                  </h6>
                  <div style={{ paddingTop: "14px" }}>
                    <label
                      htmlFor="image"
                      onChange={(e: any) => handleFileUpload(e)}
                    >
                      <div className="avatar-img-icon">
                        <EditIcon className=" cursorPointer" />
                      </div>
                      <input
                        type="file"
                        name="image"
                        id="image"
                        style={{ display: "none" }}
                      />

                      <img
                        height={150}
                        width={150}
                        src={imagePath}
                        onError={(e) => {
                          const target: any = e.target as HTMLImageElement;
                          target.src = UserImage;
                        }}
                        alt="Profile Avatar"
                      />
                    </label>
                  </div>
                  <h5 className="fw-semibold boxCenter mt-2">{data?.name}</h5>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-sm-12">
              <div className="mb-4">
                <div className="withdrawal-box payment-box">
                  <h6 className="mb-0 ">Edit Profile</h6>
                  <div className="row">
                    <form>
                      <div className="row">
                        <div className="col-12 withdrawal-input">
                          <Input
                            label={"Name"}
                            name={"name"}
                            type={"text"}
                            value={name}
                            errorMessage={error.name && error.name}
                            placeholder={"Enter Detail...."}
                            onChange={(e) => {
                              setName(e.target.value);
                              if (!e.target.value) {
                                return setError({
                                  ...error,
                                  name: "Name Is Required",
                                });
                              } else {
                                return setError({
                                  ...error,
                                  name: "",
                                });
                              }
                            }}
                          />
                        </div>
                        <div className="col-12 withdrawal-input border-0 mt-2">
                          <Input
                            label={"Email"}
                            name={"email"}
                            value={email}
                            type={"text"}
                            errorMessage={error.email && error.email}
                            placeholder={"Enter Detail...."}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (!e.target.value) {
                                return setError({
                                  ...error,
                                  email: "Email Is Required",
                                });
                              } else {
                                return setError({
                                  ...error,
                                  email: "",
                                });
                              }
                            }}
                          />
                        </div>
                        <div className="col-12 d-flex mt-3 justify-content-end">
                          <Button
                            btnName={"Submit"}
                            type={"button"}
                            onClick={handleEditProfile}
                            newClass={"submit-btn"}
                            style={{
                              borderRadius: "0.5rem",
                              width: "88px",
                              marginLeft: "10px",
                            }}
                          />
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-sm-12">
              <div className="mb-4">
                <div className="withdrawal-box payment-box">
                  <h6 className="mb-0 ">Change Password</h6>
                  <div className="row">
                    <form>
                      <div className="row">
                        <div className="col-12 withdrawal-input">
                          <Input
                            label={"Old Password"}
                            name={"oldPassword"}
                            value={oldPassword}
                            type={"password"}
                            errorMessage={
                              error.oldPassword && error.oldPassword
                            }
                            placeholder={"Enter Old Password"}
                            onChange={(e) => {
                              setOldPassword(e.target.value);
                              if (!e.target.value) {
                                return setError({
                                  ...error,
                                  oldPassword: "Old Password Is Required",
                                });
                              } else {
                                return setError({
                                  ...error,
                                  oldPassword: "",
                                });
                              }
                            }}
                          />
                        </div>
                        <div className="col-12 col-sm-12 col-md-6 col-lg-6 withdrawal-input border-0 mt-2">
                          <Input
                            label={"New Password"}
                            name={"newPassword"}
                            value={newPassword}
                            errorMessage={
                              error.newPassword && error.newPassword
                            }
                            type={"password"}
                            placeholder={"Enter New Password"}
                            onChange={(e) => {
                              setNewPassword(e.target.value);
                              if (!e.target.value) {
                                return setError({
                                  ...error,
                                  newPassword: "New Password Is Required",
                                });
                              } else {
                                return setError({
                                  ...error,
                                  newPassword: "",
                                });
                              }
                            }}
                          />
                        </div>
                        <div className="col-12 col-sm-12 col-md-6 col-lg-6 withdrawal-input border-0 mt-2">
                          <Input
                            label={"Confirm Password"}
                            name={"confirmPassword"}
                            value={confirmPassword}
                            className={`form-control`}
                            type={"password"}
                            errorMessage={
                              error.confirmPassword && error.confirmPassword
                            }
                            placeholder={"Enter Confirm Password"}
                            onChange={(e) => {
                              setConfirmPassword(e.target.value);
                              if (!e.target.value) {
                                return setError({
                                  ...error,
                                  confirmPassword:
                                    "Confirm Password Is Required",
                                });
                              } else {
                                return setError({
                                  ...error,
                                  confirmPassword: "",
                                });
                              }
                            }}
                          />
                        </div>
                        <div className="col-12 d-flex mt-3 justify-content-end">
                          <Button
                            btnName={"Submit"}
                            type={"button"}
                            onClick={handlePassword}
                            newClass={"submit-btn"}
                            style={{
                              borderRadius: "0.5rem",
                              width: "88px",
                              marginLeft: "10px",
                            }}
                          />
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
Owner.getLayout = function getLayout(page) {
  return <RootLayout>{page}</RootLayout>;
};

export default Owner;
