import { useEffect, useState } from "react";
import { api } from "../services/api";
import type {
  ArtistRef,
  LibrarySummary,
  TrackItem,
} from "../types/recommendation";
import { timeAgo } from "../utils/timeAgo";
import Modal from "./Modal";

type ModalKind = "liked" | "followed" | null;

function matches(query: string, ...fields: string[]) {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return fields.some((field) => field.toLowerCase().includes(q));
}

function LibrarySection() {
  const [data, setData] = useState<LibrarySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openModal, setOpenModal] = useState<ModalKind>(null);
  const [search, setSearch] = useState("");

  const [likedSongs, setLikedSongs] = useState<TrackItem[]>([]);
  const [likedHasMore, setLikedHasMore] = useState(false);
  const [likedLoadingMore, setLikedLoadingMore] = useState(false);

  const [followedArtists, setFollowedArtists] = useState<ArtistRef[]>([]);
  const [followedCursor, setFollowedCursor] = useState<string | null>(null);
  const [followedLoadingMore, setFollowedLoadingMore] = useState(false);

  useEffect(() => {
    let active = true;

    api
      .get<LibrarySummary>("/me/library")
      .then((res) => {
        if (!active) return;

        setData(res.data);
        setLikedSongs(res.data.likedSongs);
        setLikedHasMore(res.data.likedSongs.length < res.data.likedSongsCount);
        setFollowedArtists(res.data.followedArtists);
        setFollowedCursor(res.data.followedArtistsNextCursor);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function openModalWith(kind: ModalKind) {
    setSearch("");
    setOpenModal(kind);
  }

  function loadMoreLiked() {
    if (likedLoadingMore || !likedHasMore) return;

    setLikedLoadingMore(true);

    api
      .get<{ items: TrackItem[]; total: number }>("/me/library/liked-songs", {
        params: { offset: likedSongs.length },
      })
      .then((res) => {
        setLikedSongs((prev) => [...prev, ...res.data.items]);
        setLikedHasMore(
          likedSongs.length + res.data.items.length < res.data.total,
        );
      })
      .catch(() => setLikedHasMore(false))
      .finally(() => setLikedLoadingMore(false));
  }

  function loadMoreFollowed() {
    if (followedLoadingMore || !followedCursor) return;

    setFollowedLoadingMore(true);

    api
      .get<{ items: ArtistRef[]; nextCursor: string | null }>(
        "/me/library/followed-artists",
        { params: { after: followedCursor } },
      )
      .then((res) => {
        setFollowedArtists((prev) => [...prev, ...res.data.items]);
        setFollowedCursor(res.data.nextCursor);
      })
      .catch(() => setFollowedCursor(null))
      .finally(() => setFollowedLoadingMore(false));
  }

  const hero = (
    <header className="hero">
      <p className="eyebrow">sua coleção</p>
      <h2 className="title">sua biblioteca</h2>
      <p className="subtitle">
        músicas curtidas, artistas seguidos e as playlists que você criou no
        Spotify.
      </p>
    </header>
  );

  if (loading) {
    return (
      <>
        {hero}
        <section className="resultCard">
          <p className="emptyText">carregando...</p>
        </section>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        {hero}
        <section className="resultCard">
          <p className="emptyText">
            não foi possível carregar sua biblioteca.
          </p>
        </section>
      </>
    );
  }

  const filteredLiked = likedSongs.filter((track) =>
    matches(search, track.name, track.artist),
  );
  const filteredFollowed = followedArtists.filter((artist) =>
    matches(search, artist.name),
  );

  const biggestPlaylist = data.playlists.reduce<
    (typeof data.playlists)[number] | null
  >((biggest, playlist) => {
    if (!biggest || playlist.tracksTotal > biggest.tracksTotal) {
      return playlist;
    }
    return biggest;
  }, null);

  return (
    <>
      {hero}
      <section className="resultWrapper">
        <div className="resultCard">
          <h2 className="sectionTitle">visão geral</h2>

          <div className="statRow">
            <button
              type="button"
              className="statTile statTileButton"
              onClick={() => openModalWith("liked")}
            >
              <span className="statValue">{data.likedSongsCount}</span>
              <span className="statLabel">músicas curtidas</span>
            </button>

            <button
              type="button"
              className="statTile statTileButton"
              onClick={() => openModalWith("followed")}
            >
              <span className="statValue">{data.followedArtistsCount}</span>
              <span className="statLabel">artistas seguidos</span>
            </button>

            <div className="statTile">
              <span className="statValue">{data.playlists.length}</span>
              <span className="statLabel">playlists</span>
            </div>
          </div>
        </div>

        {data.likePeakDay || biggestPlaylist ? (
          <div className="resultCard">
            <h2 className="sectionTitle">curiosidades</h2>

            <div className="highlightList">
              {data.likePeakDay ? (
                <div className="highlightRow">
                  <span className="highlightLabel">
                    dia que você mais curte músicas
                  </span>
                  <span className="highlightValue">{data.likePeakDay}</span>
                </div>
              ) : null}

              {biggestPlaylist ? (
                <div className="highlightRow">
                  <span className="highlightLabel">sua maior playlist</span>
                  <span className="highlightValue">
                    {biggestPlaylist.name} ({biggestPlaylist.tracksTotal}{" "}
                    faixas)
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="resultCard">
          <h2 className="sectionTitle">suas playlists</h2>

          {data.playlists.length === 0 ? (
            <p className="emptyText">nenhuma playlist encontrada.</p>
          ) : (
            <div className="cardList">
              {data.playlists.map((playlist) => (
                <article className="musicCard" key={playlist.url}>
                  {playlist.image ? (
                    <img
                      className="cover"
                      src={playlist.image}
                      alt={playlist.name}
                    />
                  ) : null}

                  <div className="cardContent">
                    <strong>{playlist.name}</strong>
                    <span>
                      {playlist.tracksTotal} faixas
                      {playlist.owner ? ` · ${playlist.owner}` : ""}
                    </span>
                    <a
                      href={playlist.url}
                      target="_blank"
                      rel="noreferrer"
                      className="link"
                    >
                      abrir no spotify
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {openModal === "liked" ? (
        <Modal
          title="músicas curtidas"
          onClose={() => setOpenModal(null)}
          onScrollEnd={loadMoreLiked}
        >
          <input
            type="text"
            className="modalSearch"
            placeholder="buscar por música ou artista..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {filteredLiked.length === 0 ? (
            <p className="emptyText">
              {likedSongs.length === 0
                ? "nenhuma música curtida encontrada."
                : "nenhum resultado pra essa busca."}
            </p>
          ) : (
            <div className="cardList">
              {filteredLiked.map((track) => (
                <article className="musicCard" key={track.url}>
                  {track.image ? (
                    <img
                      className="cover"
                      src={track.image}
                      alt={track.name}
                    />
                  ) : null}

                  <div className="cardContent">
                    <strong>{track.name}</strong>
                    <span>{track.artist}</span>
                    {track.addedAt ? (
                      <span className="meterCaption">
                        curtiu {timeAgo(track.addedAt)}
                      </span>
                    ) : null}
                    <a
                      href={track.url}
                      target="_blank"
                      rel="noreferrer"
                      className="link"
                    >
                      ouvir no spotify
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}

          {likedLoadingMore ? (
            <p className="emptyText" style={{ textAlign: "center" }}>
              carregando mais...
            </p>
          ) : null}
        </Modal>
      ) : null}

      {openModal === "followed" ? (
        <Modal
          title="artistas seguidos"
          onClose={() => setOpenModal(null)}
          onScrollEnd={loadMoreFollowed}
        >
          <input
            type="text"
            className="modalSearch"
            placeholder="buscar por artista..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {filteredFollowed.length === 0 ? (
            <p className="emptyText">
              {followedArtists.length === 0
                ? "nenhum artista seguido encontrado."
                : "nenhum resultado pra essa busca."}
            </p>
          ) : (
            <div className="cardList">
              {filteredFollowed.map((artist) => (
                <article className="musicCard" key={artist.url}>
                  {artist.image ? (
                    <img
                      className="cover"
                      src={artist.image}
                      alt={artist.name}
                    />
                  ) : null}

                  <div className="cardContent">
                    <strong>{artist.name}</strong>
                    <a
                      href={artist.url}
                      target="_blank"
                      rel="noreferrer"
                      className="link"
                    >
                      ver no spotify
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}

          {followedLoadingMore ? (
            <p className="emptyText" style={{ textAlign: "center" }}>
              carregando mais...
            </p>
          ) : null}
        </Modal>
      ) : null}
    </>
  );
}

export default LibrarySection;
