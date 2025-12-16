/* Index the RAL version of the Edinburgh Associative Thesaurus.  

M.D. Wilson 
Informatics Department, 
Rutherford Appleton Laboratory,
Chilton, 
Didcot, 
Oxon, 
OQX OX11, 
U.K. 

June 1988 
*/

#include <stdio.h>
#include <strings.h>			

#define SRFILE "sr.concise" /* file containing s-r data */
#define RSFILE "rs.concise" /* file containing r-s data */
#define SRINDEX "sr.index" /* s-r index file */
#define RSINDEX "rs.index" /* r-s index file */
#define SRHEADS "sr.heads" /* file containing s-r headwords*/
#define RSHEADS "rs.heads" /* file containing r-s headwords*/
#define MAXBUF 100000

static char sourcef = 's'; /*default source file is srfile */

usage()			/* print proper usage and exit */
{
	puts("Usage: eatindex -rs ");
	puts("Index headwords in Edinburgh Associative Thesaurus");
	puts("writes to default files");
	puts("-s read stimulus file (default)");
	puts("-r read response file");
	exit(1);
}

main(argc, argv)	/* exclude words or lines from file */
int argc;
char *argv[];
{
	FILE *fp, *fp1, *fp2, *fopen();
	int i, fail;
	char header_word[MAXBUF], response_word[MAXBUF],index_word[MAXBUF];
	long offset, ftell(), offsetc;

	if (argc > 1){
		for (i = 1; i < argc; i++)
		{
			if (*argv[i] == '-')
				getflag(argv[i]);
			
		}
	}

   if (sourcef == 's'){
   	if ((fp = fopen(SRFILE, "r")) == NULL){
   		fprintf(stderr,
     	 	"cannot access the file: %s\n", SRFILE);
  	 	exit(1);
   	}

	   if ((fp1 = fopen(SRINDEX, "w")) == NULL){
	   	fprintf(stderr,
	     	 "cannot access the file: %s\n", SRINDEX);
	  	 exit(1);
	}
	   if ((fp2 = fopen(SRHEADS, "r")) == NULL){
	   	fprintf(stderr,
	     	 "cannot access the file: %s\n", SRHEADS);
	  	 exit(1);
	}
   }

   if (sourcef == 'r') {
	   if ((fp = fopen(RSFILE, "r")) == NULL){
	   	fprintf(stderr,
	     	 "cannot access the file: %s\n", RSFILE);
	  	 exit(1);
	   }


	   if ((fp1 = fopen(RSINDEX, "w")) == NULL){
	   	fprintf(stderr,
	     	 "cannot access the file: %s\n", RSINDEX);
	  	 exit(1);
	   }

	   if ((fp2 = fopen(RSHEADS, "r")) == NULL){
	   	fprintf(stderr,
	     	 "cannot access the file: %s\n", RSHEADS);
	  	 exit(1);
	   }
    }


	for (i=0;;i++){
		offset = ftell(fp);
		if (fgets (header_word, MAXBUF,fp) == NULL){
			fail = 1;
			break;
		}
		offsetc = ftell(fp);
		if (fgets (index_word, MAXBUF,fp2) == NULL){
			fail = 2;
			break;
		}
		if (fgets (response_word, MAXBUF,fp) == NULL){
			fail = 3;
			break;
		}

		strncpy(response_word, index_word, 20);
		response_word[20] = '\0';
		no_trail(response_word);
		header_word[strlen(header_word)-1] = '\0';

		if (strcmp(response_word, header_word) != 0){
 			printf("%s %s\n", index_word, header_word);
			printf("error: %s %s\n", index_word, response_word);
			exit(1);
		}

		index_word[strlen(index_word)-1] = '\0';

 		fprintf(fp1,"%s %d %d\n", index_word, offset, offsetc);
	}
	fclose(fp1);
}

no_trail(string)
char string[];
{
	int i,j;

	j = (strlen(string) -1);

	for (i=j;i>=0;--i){
		if(string[i] != ' ')
			break;
	}

	if (i < j)
	  string[i+1] = '\0';
	
}

getflag(f)		/* parses command line to set options */
char *f;
{

	f++;
	switch(*f++)
	{
		case 's':	/* read s-r file */
			sourcef = 's';
			break;
		case 'r':
			sourcef = 'r'; /* read r-s file */
			break;
 		case NULL:		/*error*/
			usage();
			exit(1);
			break;
		default:
			usage();
			exit(1);
			break;
	}
}
