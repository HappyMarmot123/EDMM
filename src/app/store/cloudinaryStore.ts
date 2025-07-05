import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { setCloudinaryData, setCloudinaryError } from "./service/storeService";
import {
  CloudinaryResourceMap,
  CloudinaryStoreState,
} from "@/shared/types/dataType";

/*
TODO:
  if you use custom equality function such as shallow, 
  the easiest migration is to use createWithEqualityFn in v5.
  https://github.com/pmndrs/zustand/blob/HEAD/docs/migrations/migrating-to-v5.md#using-custom-equality-functions-such-as-shallow
*/

const useCloudinaryStore = create<CloudinaryStoreState>()(
  subscribeWithSelector((set) => ({
    cloudinaryData: new Map() as CloudinaryResourceMap,
    cloudinaryError: null,
    isLoadingCloudinary: true,

    setCloudinaryData: setCloudinaryData(set),
    setCloudinaryError: setCloudinaryError(set),
  }))
);

export default useCloudinaryStore;
