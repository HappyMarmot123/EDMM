import { CloudinaryStoreState } from "@/shared/types/dataType";
import { createWithEqualityFn } from "zustand/traditional";
import { setCloudinaryData, setCloudinaryError } from "./service/storeService";

/*
TODO:
  if you use custom equality function such as shallow, 
  the easiest migration is to use createWithEqualityFn in v5.
  https://github.com/pmndrs/zustand/blob/HEAD/docs/migrations/migrating-to-v5.md#using-custom-equality-functions-such-as-shallow
*/

const useCloudinaryStore = createWithEqualityFn<CloudinaryStoreState>(
  (set) => ({
    cloudinaryData: new Map(),
    cloudinaryError: null,
    isLoadingCloudinary: true,

    setCloudinaryData: setCloudinaryData(set),
    setCloudinaryError: setCloudinaryError(set),
  })
);

export default useCloudinaryStore;
