# Stability AI API Docs

# StabilityAI REST API (v2beta)

Download OpenAPI specification:Download

Download

Welcome to the Stability Platform API. As of March 2024, we are building the REST v2beta API service to be the primary API service for the Stability Platform. All AI services on other APIs (gRPC, REST v1, RESTv2alpha) will continue to be maintained, however they will not receive new features or parameters.

If you are a REST v2alpha user, we strongly recommend that you adjust the URL calls for the specific services that you are using over to the equivalent REST v2beta URL. Normally, this means simply replacing "v2alpha" with "v2beta". We are not deprecating v2alpha URLs at this time for users that are currently using them.

### **Authentication**

You will need your [Stability API key](https://platform.stability.ai/account/keys) in order to make requests to this API. Make sure you never share your API key with anyone, and you never commit it to a public repository. Include this key in the `Authorization` header of your requests.

### **Rate limiting**

This API is rate-limited to 150 requests every 10 seconds. If you exceed this limit, you will receive a `429` response and be timed out for 60 seconds. If you find this limit too restrictive, please reach out to us via [this form](https://stabilityplatform.freshdesk.com/support/home).

### **Support**

Please see our [FAQ](https://platform.stability.ai/faq) for answers to common questions. If you have any other questions or concerns, please reach out to us via [this form](https://stabilityplatform.freshdesk.com/support/tickets/new).

To see the health of our APIs, please check our [Status Page](https://stabilityai.instatus.com/).

## Generate

Tools to generate new images from text, or create variations of existing images. Our different services include:

[**Stable Image Ultra**](https://platform.stability.ai/docs/api-reference#tag/Generate/paths/~1v2beta~1stable-image~1generate~1ultra/post): Photorealistic, Large-Scale Output

Our state of the art text to image model based on Stable Diffusion 3.5. Stable Image Ultra Produces the highest quality, photorealistic outputs perfect for professional print media and large format applications. Stable Image Ultra excels at rendering exceptional detail and realism.

[**Stable Image Core**](https://platform.stability.ai/docs/api-reference#tag/Generate/paths/~1v2beta~1stable-image~1generate~1core/post): Fast and Affordable

Optimized for fast and aﬀordable image generation, great for rapidly iterating on concepts during ideation. Stable Image Core is the next generation model following Stable Diffusion XL.

[**Stable Diffusion 3 & 3.5 Model Suite**](https://platform.stability.ai/docs/api-reference#tag/Generate/paths/~1v2beta~1stable-image~1generate~1sd3/post): Stability AI's latest base models

The different versions of our open models are available via API, letting you test and adjust speed and quality based on your use case. All model versions strike a balance between generation speed and output quality and are ideal for creating high-volume, high-quality digital assets like websites, newsletters, and marketing materials.

## Stable Image Ultra

Our most advanced text to image generation service, Stable Image Ultra creates the highest quality images with unprecedented prompt understanding. Ultra excels in typography, complex compositions, dynamic lighting, vibrant hues, and overall cohesion and structure of an art piece. Made from the most advanced models, including Stable Diffusion 3.5, Ultra offers the best of the Stable Diffusion ecosystem.

### Try it out

Grab your [API key](https://platform.stability.ai/account/keys) and head over to

![https://platform.stability.ai/svg/google-colab.svg](https://platform.stability.ai/svg/google-colab.svg)

### How to use

Please invoke this endpoint with a `POST` request.

The headers of the request must include an API key in the `authorization` field. The body of the request must be `multipart/form-data`. The accept header should be set to one of the following:

- `image/*` to receive the image in the format specified by the `output_format` parameter.
- `application/json` to receive the image in the format specified by the `output_format` parameter, but encoded to base64 in a JSON response.

The only required parameter is the `prompt` field, which should contain the text prompt for the image generation.

The body of the request should include:

- `prompt` - text to generate the image from

The body may optionally include:

- `image` - the image to use as the starting point for the generation
- `strength` - controls how much influence the `image` parameter has on the output image
- `aspect_ratio` - the aspect ratio of the output image
- `negative_prompt` - keywords of what you **do not** wish to see in the output image
- `seed` - the randomness seed to use for the generation
- `output_format` - the the format of the output image

> Note: for the full list of optional parameters, please see the request schema below.
> 

### Output

The resolution of the generated image will be 1 megapixel. The default resolution is 1024x1024.

### Credits

The Ultra service uses 8 credits per successful result. You will not be charged for failed results.

**Authorizations:**

*STABILITY_API_KEY*

### header Parameters

| authorizationrequired | string non-empty
Your [Stability API key](https://platform.stability.ai/account/keys), used to authenticate your requests. Although you may have multiple keys in your account, you should use the same key for all requests to this API. |
| --- | --- |
| content-typerequired | string non-emptyExample: multipart/form-data
The content type of the request body. Do not manually specify this header; your HTTP client library will automatically include the appropriate boundary parameter. |
| accept | stringDefault: image/*Enum: application/json image/*
Specify `image/*` to receive the bytes of the image directly. Otherwise specify `application/json` to receive the image as base64 encoded JSON. |
| stability-client-id | string (StabilityClientID) <= 256 charactersExample: my-awesome-app
The name of your application, used to help us communicate app-specific debugging or moderation issues to you. |
| stability-client-user-id | string (StabilityClientUserID) <= 256 charactersExample: DiscordUser#9999
A unique identifier for your end user. Used to help us communicate user-specific debugging or moderation issues to you. Feel free to obfuscate this value to protect user privacy. |
| stability-client-version | string (StabilityClientVersion) <= 256 charactersExample: 1.2.1
The version of your application, used to help us communicate version-specific debugging or moderation issues to you. |

### Request Body schema: multipart/form-data

| promptrequired | string [ 1 .. 10000 ] characters
What you wish to see in the output image. A strong, descriptive prompt that clearly defines elements, colors, and subjects will lead to better results.
To control the weight of a given word use the format `(word:weight)`, where `word` is the word you'd like to control the weight of and `weight` is a value between 0 and 1. For example: `The sky was a crisp (blue:0.3) and (green:0.8)` would convey a sky that was blue and green, but more green than blue. |
| --- | --- |
| negative_prompt | string <= 10000 characters
A blurb of text describing what you **do not** wish to see in the output image.
This is an advanced feature. |
| aspect_ratio | stringDefault: 1:1Enum: 16:9 1:1 21:9 2:3 3:2 4:5 5:4 9:16 9:21
Controls the aspect ratio of the generated image. |
| seed | number [ 0 .. 4294967294 ]Default: 0
A specific value that is used to guide the 'randomness' of the generation. (Omit this parameter or pass `0` to use a random seed.) |
| output_format | stringDefault: pngEnum: jpeg png webp
Dictates the `content-type` of the generated image. |
| image | string <binary>
The image to use as the starting point for the generation.**Important:** The `strength` parameter is required when `image` is provided.
Supported Formats:
• jpeg
• png
• webp
Validation Rules:
• Width must be between 64 and 16,384 pixels
• Height must be between 64 and 16,384 pixels
• Total pixel count must be at least 4,096 pixels |
| strength | number [ 0 .. 1 ]
Sometimes referred to as *denoising*, this parameter controls how much influence the `image` parameter has on the generated image. A value of 0 would yield an image that is identical to the input. A value of 1 would be as if you passed in no image at all.**Important:** This parameter is required when `image` is provided. |

### Responses

**200**
Generation was successful.

**400**
Invalid parameter(s), see the `errors` field for details.

**403**
Your request was flagged by our content moderation system.

**413**
Your request was larger than 10MiB.

**422**
Your request was well-formed, but rejected. See the `errors` field for details.

**429**
You have made more than 150 requests in 10 seconds.

**500**
An internal error occurred. If the problem persists [contact support](https://stabilityplatform.freshdesk.com/support/tickets/new).

post/v2beta/stable-image/generate/ultra

### Request samples

- **Python**
- **JavaScript**
- **cURL**

Copy

```
import requests

response = requests.post(
    f"https://api.stability.ai/v2beta/stable-image/generate/ultra",
    headers={
        "authorization": f"Bearer sk-MYAPIKEY",
        "accept": "image/*"
    },
    files={"none": ''},
    data={
        "prompt": "Lighthouse on a cliff overlooking the ocean",
        "output_format": "webp",
    },
)

if response.status_code == 200:
    with open("./lighthouse.webp", 'wb') as file:
        file.write(response.content)
else:
    raise Exception(str(response.json()))
```

### Response samples

- **200**
- **400**
- **403**
- **413**
- **422**
- **429**
- **500**

**Content type**

image/jpegapplication/json; type=image/jpegimage/pngapplication/json; type=image/pngimage/webpapplication/json; type=image/webpimage/jpeg

Copy

```
The bytes of the generated jpeg.
(Caution: may contain cats)
```

## Stable Image Core

Our primary service for text-to-image generation, Stable Image Core represents the best quality achievable at high speed. No prompt engineering is required! Try asking for a style, a scene, or a character, and see what you get.

### Try it out

Grab your [API key](https://platform.stability.ai/account/keys) and head over to

![https://platform.stability.ai/svg/google-colab.svg](https://platform.stability.ai/svg/google-colab.svg)

### How to use

Please invoke this endpoint with a `POST` request.

The headers of the request must include an API key in the `authorization` field. The body of the request must be `multipart/form-data`, and the `accept` header should be set to one of the following:

- `image/*` to receive the image in the format specified by the `output_format` parameter.
- `application/json` to receive the image encoded as base64 in a JSON response.

The body of the request should include:

- `prompt`

The body may optionally include:

- `aspect_ratio`
- `negative_prompt`
- `seed`
- `style_preset`
- `output_format`

> Note: for more details about these parameters please see the request schema below.
> 

### Output

The resolution of the generated image will be 1.5 megapixels.

### Credits

Flat rate of 3 credits per successful generation. You will not be charged for failed generations.

**Authorizations:**

*STABILITY_API_KEY*

### header Parameters

| authorizationrequired | string non-empty
Your [Stability API key](https://platform.stability.ai/account/keys), used to authenticate your requests. Although you may have multiple keys in your account, you should use the same key for all requests to this API. |
| --- | --- |
| content-typerequired | string non-emptyExample: multipart/form-data
The content type of the request body. Do not manually specify this header; your HTTP client library will automatically include the appropriate boundary parameter. |
| accept | stringDefault: image/*Enum: application/json image/*
Specify `image/*` to receive the bytes of the image directly. Otherwise specify `application/json` to receive the image as base64 encoded JSON. |
| stability-client-id | string (StabilityClientID) <= 256 charactersExample: my-awesome-app
The name of your application, used to help us communicate app-specific debugging or moderation issues to you. |
| stability-client-user-id | string (StabilityClientUserID) <= 256 charactersExample: DiscordUser#9999
A unique identifier for your end user. Used to help us communicate user-specific debugging or moderation issues to you. Feel free to obfuscate this value to protect user privacy. |
| stability-client-version | string (StabilityClientVersion) <= 256 charactersExample: 1.2.1
The version of your application, used to help us communicate version-specific debugging or moderation issues to you. |

### Request Body schema: multipart/form-data

| promptrequired | string [ 1 .. 10000 ] characters
What you wish to see in the output image. A strong, descriptive prompt that clearly defines elements, colors, and subjects will lead to better results.
To control the weight of a given word use the format `(word:weight)`, where `word` is the word you'd like to control the weight of and `weight` is a value between 0 and 1. For example: `The sky was a crisp (blue:0.3) and (green:0.8)` would convey a sky that was blue and green, but more green than blue. |
| --- | --- |
| aspect_ratio | stringDefault: 1:1Enum: 16:9 1:1 21:9 2:3 3:2 4:5 5:4 9:16 9:21
Controls the aspect ratio of the generated image. |
| negative_prompt | string <= 10000 characters
A blurb of text describing what you **do not** wish to see in the output image.
This is an advanced feature. |
| seed | number [ 0 .. 4294967294 ]Default: 0
A specific value that is used to guide the 'randomness' of the generation. (Omit this parameter or pass `0` to use a random seed.) |
| style_preset | stringEnum: 3d-model analog-film anime cinematic comic-book digital-art enhance fantasy-art isometric line-art low-poly modeling-compound neon-punk origami photographic pixel-art tile-texture
Guides the image model towards a particular style. |
| output_format | stringDefault: pngEnum: jpeg png webp
Dictates the `content-type` of the generated image. |

### Responses

**200**
Generation was successful.

**400**
Invalid parameter(s), see the `errors` field for details.

**403**
Your request was flagged by our content moderation system.

**422**
Your request was well-formed, but rejected. See the `errors` field for details.

**429**
You have made more than 150 requests in 10 seconds.

**500**
An internal error occurred. If the problem persists [contact support](https://stabilityplatform.freshdesk.com/support/tickets/new).

post/v2beta/stable-image/generate/core

### Request samples

- **Python**
- **JavaScript**
- **cURL**

Copy

```
import requests

response = requests.post(
    f"https://api.stability.ai/v2beta/stable-image/generate/core",
    headers={
        "authorization": f"Bearer sk-MYAPIKEY",
        "accept": "image/*"
    },
    files={"none": ''},
    data={
        "prompt": "Lighthouse on a cliff overlooking the ocean",
        "output_format": "webp",
    },
)

if response.status_code == 200:
    with open("./lighthouse.webp", 'wb') as file:
        file.write(response.content)
else:
    raise Exception(str(response.json()))
```

### Response samples

- **200**
- **400**
- **403**
- **422**
- **429**
- **500**

**Content type**

image/pngapplication/json; type=image/pngimage/jpegapplication/json; type=image/jpegimage/webpapplication/json; type=image/webpimage/png

Copy

```
The bytes of the generated png.
(Caution: may contain cats)
```

## Stable Diffusion 3.0 & 3.5

Generate using Stable Diffusion 3.5 models, Stability AI latest base model:

- **Stable Diffusion 3.5 Large**: At 8 billion parameters, with superior quality and prompt adherence, this base model is the most powerful in the Stable Diffusion family. This model is ideal for professional use cases at 1 megapixel resolution.
- **Stable Diffusion 3.5 Large Turbo**: A distilled version of Stable Diffusion 3.5 Large. SD3.5 Large Turbo generates high-quality images with exceptional prompt adherence in just 4 steps, making it considerably faster than Stable Diffusion 3.5 Large.
- **Stable Diffusion 3.5 Medium**: With 2.5 billion parameters, the model delivers an optimal balance between prompt accuracy and image quality, making it an efficient choice for fast high-performance image generation.

Read more about the model capabilities [here](https://stability.ai/news/introducing-stable-diffusion-3-5).

Stable Diffusion 3.0 models are also supported, powered by [Fireworks AI](https://fireworks.ai/). API status can be reviewed [here](https://readme.fireworks.ai/page/application-status).

- **SD3 Large**: the 8 billion parameter model
- **SD3 Large Turbo**: the 8 billion parameter model with a faster inference time
- **SD3 Medium**: the 2 billion parameter model

### Try it out

Grab your [API key](https://platform.stability.ai/account/keys) and head over to

![https://platform.stability.ai/svg/google-colab.svg](https://platform.stability.ai/svg/google-colab.svg)

### How to use

Please invoke this endpoint with a `POST` request.

The headers of the request must include an API key in the `authorization` field. The body of the request must be `multipart/form-data`. The accept header should be set to one of the following:

- `image/*` to receive the image in the format specified by the `output_format` parameter.
- `application/json` to receive the image encoded as base64 in a JSON response.

### **Generating with a prompt**

Commonly referred to as **text-to-image**, this mode generates an image from text alone. While the only required parameter is the `prompt`, it also supports an `aspect_ratio` parameter which can be used to control the aspect ratio of the generated image.

### **Generating with a prompt *and* an image**

Commonly referred to as **image-to-image**, this mode also generates an image from text but uses an existing image as the starting point. The required parameters are:

- `prompt` - text to generate the image from
- `image` - the image to use as the starting point for the generation
- `strength` - controls how much influence the `image` parameter has on the output image
- `mode` - must be set to `image-to-image`

> Note: maximum request size is 10MiB.
> 

### **Optional Parameters:**

Both modes support the following optional parameters:

- `model` - the model to use (SD3 Large, SD3 Large Turbo, or SD3 Medium)
- `output_format` - the the format of the output image
- `seed` - the randomness seed to use for the generation
- `negative_prompt` - keywords of what you **do not** wish to see in the output image
- `cfg_scale` - controls how strictly the diffusion process adheres to the prompt text

> Note: for more details about these parameters please see the request schema below.
> 

### Output

The resolution of the generated image will be 1MP. The default resolution is 1024x1024.

### Credits

- **SD 3.5 & 3.0 Large**: Flat rate of 6.5 credits per successful generation.
- **SD 3.5 & 3.0 Large Turbo**: Flat rate of 4 credits per successful generation.
- **SD 3.5 & 3.0 Medium**: Flat rate of 3.5 credits per successful generation.

As always, you will not be charged for failed generations.

```jsx
https://api.stability.ai/v2beta/stable-image/generate/sd3
```

```jsx
import fs from "node:fs";
import axios from "axios";
import FormData from "form-data";

const payload = {
  prompt: "Lighthouse on a cliff overlooking the ocean",
  output_format: "jpeg"
};

const response = await axios.postForm(
  `https://api.stability.ai/v2beta/stable-image/generate/sd3`,
  axios.toFormData(payload, new FormData()),
  {
    validateStatus: undefined,
    responseType: "arraybuffer",
    headers: { 
      Authorization: `Bearer sk-MYAPIKEY`, 
      Accept: "image/*" 
    },
  },
);

if(response.status === 200) {
  fs.writeFileSync("./lighthouse.jpeg", Buffer.from(response.data));
} else {
  throw new Error(`${response.status}: ${response.data.toString()}`);
}
```