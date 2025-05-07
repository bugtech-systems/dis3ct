import { useState } from 'react';
import Image, { ImageProps } from 'next/image';

type SafeImageProps = Omit<ImageProps, 'src'> & {
    src?: string;
    fallbackSrc?: string;
    clickable?: any;
};

export default function SafeImage({
    src,
    fallbackSrc = '/restricted.png',
    alt,
    clickable,
    ...rest
}: SafeImageProps) {
    const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc);

    const handleError = () => {
        if (imgSrc !== fallbackSrc) {
            setImgSrc(fallbackSrc);
        }
    };

    return (
        <>
            {clickable ?
                <a
                    href={imgSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={alt}
                >
                    <img
                        src={imgSrc}
                        alt={alt}
                        onError={handleError}
                        {...rest}
                    />
                </a>
                :
                <img
                    src={imgSrc}
                    alt={alt}
                    onError={handleError}
                    {...rest}
                />
            }
        </>

    );
}
