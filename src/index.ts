import express from "express";

interface DogAPIPicsResponse {
  message: Array<string>;
  status: string;
}

interface DogAPIListResponse {
  message: Record<string, Array<string>>;
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

class DogCEOImpl extends DogsService {
  async getDogPics(breed: Breed): Promise<DogPicsResponse | Error> {
    const res = await fetch(`https://dog.ceo/api/${breed}/images`)
      .then((res) => {
        if (!res.ok) throw new Error("Bad response");
        return res;
      })
      .then((res) => res.json() as unknown as DogAPIPicsResponse)
      .catch((err) => new Error(`failed to fetch breed pics: ${err}`));

    if (res instanceof Error) {
      return res;
    }

    return {
      data: res.message,
    } as DogPicsResponse;
  }

  async getDogsList(): Promise<DogsListResponse | Error> {
    const res = await fetch(`https://dog.ceo/api/breeds/list/all`)
      .then((res) => {
        if (!res.ok) throw new Error("Bad response");
        return res;
      })
      .then((res) => res.json())
      .catch((err) => new Error(`failed to fetch breeds list: ${err}`));

    if (res instanceof Error) {
      return res;
    }

    return {
      data: res.message,
    } as DogsListResponse;
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
  const list = await client.getList();

  if (list instanceof Error) {
    res.status(400).send({
      message: list.message,
    });
  } else {
    res.status(200).send(list);
  }
});

app.get("/pics/:breed", async (req, res) => {
  const pics = await client.getPics(req.params.breed);

  if (pics instanceof Error) {
    res.status(400).send({
      message: pics.message,
    });
  } else {
    res.status(200).json(pics);
  }
});

app.listen(3000, () => {
  console.log("Listening on PORT 3000");
});
