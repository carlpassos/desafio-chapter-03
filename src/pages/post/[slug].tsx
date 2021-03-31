import { useMemo } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format, formatDistanceToNow } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { useRouter } from 'next/router';
import Link from 'next/link';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  data: {
    next_post: any;
    prev_post: any;
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}
interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  console.log(post.data.next_post?.results[0]);
  console.log(post.data.prev_post?.results[0]);

  const minutesReading = useMemo(() => {
    const total = post.data.content.reduce(
      (acc, content) => RichText.asText(content.body).split(/\W/).length + acc,
      0
    );

    return `${Math.ceil(total / 200)} min`;
  }, [post]);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Header />
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt={post.data.title} />
      </div>
      <main className={commonStyles.container}>
        <article className={styles.postContainer}>
          <h1>{post.data.title}</h1>
          <div className={styles.info}>
            <time>
              <FiCalendar />
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </time>
            <span>
              <FiUser />
              {post.data.author}
            </span>
            <span>
              <FiClock />
              {minutesReading}
            </span>
          </div>
          <div className={styles.contentContainer}>
            {post.data.content.map(item => (
              <div key={item.heading}>
                <h2>{item.heading}</h2>
                <div
                  className={styles.content}
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(item.body),
                  }}
                />
              </div>
            ))}
          </div>
        </article>
        <footer className={styles.footer}>
          {post.data.prev_post.results[0] && (
            <Link href={`/post/${post.data.prev_post.results[0].uid}`}>
              <div>
                <h2>{post.data.prev_post.results[0].data.title}</h2>
                <span>Post Anterior</span>
              </div>
            </Link>
          )}

          {post.data.next_post.results[0] && (
            <Link href={`/post/${post.data.next_post.results[0].uid}`}>
              <div>
                <h2>{post.data.next_post.results[0].data.title}</h2>
                <span>Próximo Post</span>
              </div>
            </Link>
          )}
        </footer>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'p'),
  ]);

  const paths = posts.results.map(post => ({ params: { slug: post.uid } }));

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();

  const { slug } = params;

  const response = await prismic.getByUID('p', String(slug), {});

  const nextPost = await prismic.query(
    [
      Prismic.Predicates.at('document.type', 'p'),
      Prismic.Predicates.dateAfter(
        'document.first_publication_date',
        response.first_publication_date
      ),
    ],
    { pageSize: 1 }
  );

  const prevPost = await prismic.query(
    [
      Prismic.Predicates.at('document.type', 'p'),
      Prismic.Predicates.dateBefore(
        'document.first_publication_date',
        response.first_publication_date
      ),
    ],
    { pageSize: 1 }
  );

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      prev_post: prevPost,
      next_post: nextPost,
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(item => ({
        heading: item.heading,
        body: item.body,
      })),
    },
  };

  return {
    props: {
      post,
    },
  };
};
