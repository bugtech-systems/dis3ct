import os
image_path = r'C:\Users\jaybe\systems\alayon\alayon-next\biometrics\jb1.jpg'
if not os.path.isfile(image_path):
    print(f"Image file does not exist: {image_path}")
else:
    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if image is None:
        print(f"Failed to load image at {image_path}")
    else:
        # Proceed with image processing
        pass
