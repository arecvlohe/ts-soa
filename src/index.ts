import express from "express";

interface DogAPIPicsResponse {
  message: Array<string>;
  status: string;
}

interface DogAPIListResponse {
  message: Record<string, Array<string>>;
  status: string;
}

interface DogPicsResponse {
  data: DogAPIPicsResponse["message"];
}

interface DogsListResponse {
  data: DogAPIListResponse["message"];
}

abstract class DogsService {
  getDogPics(_breed: string): Promise<DogPicsResponse | Error> {
    return Promise.resolve(new Error("Not implemented"));
  }

  getDogsList(): Promise<DogsListResponse | Error> {
    return Promise.resolve(new Error("Not implemented"));
  }
}

type Breed = `${string}/${string}`;

class NetworkError extends Error {
  constructor(
    err: unknown,
    readonly statusCode: number,
  ) {
    super(
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : "Unknown network error",
    );
  }

  name = "NetworkError";
}

class UnexpectedResponse extends Error {
  constructor(
    err: unknown,
    readonly statusCode: number,
  ) {
    super(
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : "Unexpected response",
    );
  }

  name = "UnexpectedResponse";
}

class DogCEOImpl extends DogsService {
  async getDogPics(breed: Breed): Promise<DogPicsResponse> {
    const res = await fetch(`https://dog.ceo/api/${breed}/images`)
      .then((res) => {
        if (!res.ok) {
          throw new UnexpectedResponse("Bad response", res.status);
        }
        return res;
      })
      .then((res) => res.json() as unknown as DogAPIPicsResponse)
      .catch((err) => {
        throw new NetworkError(err, 500);
      });

    return {
      data: res.message,
    };
  }

  async getDogsList(): Promise<DogsListResponse> {
    const res = await fetch(`https://dog.ceo/api/breeds/list/all`)
      .then((res) => {
        if (!res.ok) {
          throw new UnexpectedResponse("Bad response", res.status);
        }
        return res;
      })
      .then((res) => res.json() as unknown as DogAPIListResponse)
      .catch((err) => {
        throw new NetworkError(err, 500);
      });

    return {
      data: res.message,
    };
  }
}

class DogsClient {
  constructor(private dogsService: DogsService) {}

  async getList() {
    return this.dogsService.getDogsList();
  }

  async getPics(breed: string) {
    return this.dogsService.getDogPics(breed);
  }
}

const client = new DogsClient(new DogCEOImpl());

const app = express();

app.get("/list", async (_req, res) => {
  try {
    const list = await client.getList();
    res.status(200).send(list);
  } catch (e: unknown) {
    if (e instanceof NetworkError) {
      res.status(500).send({
        message: e.message,
        status: "error",
      });
    } else if (e instanceof UnexpectedResponse) {
      res.status(e.statusCode).send({
        message: e.message,
        status: "error",
      });
    } else {
      res.status(400).send({
        message: "Unknown error",
        status: "error",
      });
    }
  }
});

app.get("/pics/:breed", async (req, res) => {
  try {
    const pics = await client.getPics(req.params.breed);
    res.status(200).json(pics);
  } catch (e) {
    if (e instanceof NetworkError) {
      res.status(e.statusCode).send({
        message: e.message,
        status: "error",
      });
    } else if (e instanceof UnexpectedResponse) {
      res.status(e.statusCode).send({
        message: e.message,
        statsu: "error",
      });
    } else {
      res.status(500).send({
        message: "Unexpected error",
        status: "error",
      });
    }
  }
});

app.listen(3000, () => {
  console.log("Listening on PORT 3000");
});
