/* Find words in the RAL version of the Edinburgh Associative Thesaurus. 
	***	EATSHOW.C	***

M.D. Wilson 
Informatics Department, 
Rutherford Appleton Laboratory,
Chilton, 
Didcot, 
Oxon, 
OQX OX11, 
U.K. 

June 1988 

comlpile with:

cc eatshow.c

The file names in the define statements should be changed for the local
installation.

The number of words in the files may change if they are altered and these
values should also be altered in the define statements.
*/

#include <stdio.h>
#include <string.h>			
#include <ctype.h>

#define SRFILE "/arch/mdw/PsychLing/eat/sr.concise" /* file containing s-r data */
#define RSFILE "/arch/mdw/PsychLing/eat/rs.concise" /* file containing r-s data */
#define SRINDEX "/arch/mdw/PsychLing/eat/sr.index" /* s-r index file */
#define RSINDEX "/arch/mdw/PsychLing/eat/rs.index" /* r-s index file */

#define SRLENGTH 8211 /* number of headwords in s-r data */
#define RSLENGTH 22776 /* number of headwords in r-s data */
#define MAXBUF 100000 /*Maximum buffer size for words or association lists*/

static char sourcef = 's'; /*default source file is srfile */

usage()			/* print proper usage and exit */
{
	puts("Usage: eatshow [-rs] ");
	puts("Find associates to words in Edinburgh Associative Thesaurus");
	puts("Outputs total number of type associates, total number of ");
	puts("token responses, then individual types with token counts");
	puts("-s use cue as stimulus(default)");
	puts("-r use cue as response");
	exit(1);
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

main(argc, argv)
int argc;
char *argv[];
{
	FILE *fp, *fp1, *fopen();
	int i, j, k, fail=3, tot_rec, tot_freq, index_length, alnum=0, count;
	float prop;
	char c, cue[MAXBUF], response_word[MAXBUF], *out1,*out2,index_word[MAXBUF];
	long tail_address, ftell(), head_address;

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

	   if ((fp1 = fopen(SRINDEX, "r")) == NULL){
	   	fprintf(stderr,
	     	 "cannot access the file: %s\n", SRINDEX);
	  	 exit(1);
	}
	index_length = SRLENGTH;
   }

   if (sourcef == 'r') {
	   if ((fp = fopen(RSFILE, "r")) == NULL){
	   	fprintf(stderr,
	     	 "cannot access the file: %s\n", RSFILE);
	  	 exit(1);
	   }


	   if ((fp1 = fopen(RSINDEX, "r")) == NULL){
	   	fprintf(stderr,
	     	 "cannot access the file: %s\n", RSINDEX);
	  	 exit(1);
	   }
	index_length = RSLENGTH;
   }


    while(gets(cue)!= NULL){

	k = strlen(cue);
	
	for(j=0;j<k;j++){
		c = cue[j];
		if (isalnum(c))
			alnum = 1;
		if(islower(c)){
			c = toupper(c);
		 	 cue[j] = c;
		}
	}

      if (alnum != 0){
	alnum = 0;

	for (i=0;i<=index_length;i++){

		if (fgets (index_word, 21, fp1) == NULL){
			fail = 1;
			break;
		}
		
		if (fscanf (fp1, "%d %d %d %d\n", &tot_rec, 
			&tot_freq, &head_address, &tail_address) != 4){
			fail = 2;
			break;
		}

		no_trail(index_word);

		if (strcmp(index_word, cue) == 0){
			fail = 0;
			break;
		}

	}

	if (fail != 0){
		printf("eatshow: %s: not found\n", cue);
		fail = 3;
	}

	else
	{
	/*============================================*/


		if (fseek(fp, tail_address, 0) != -1){
		       if (fgets (response_word, MAXBUF,fp)== NULL)	    	        	
		  		printf("eatshow: %d: bad address index file\n", tail_address);
			else
				{
		       		printf("Number of different answers: %d\n", tot_rec);
		       		printf("Total count of all answers: %d\n", tot_freq);
				out1 = strtok(response_word, "|");
				out2 = strtok((char*)0, "|");
				count = atoi(out2);
				prop = ((float)count / (float)tot_freq) ;
		       		printf("%s %d %1.2f\n", out1, count, prop);
				while(out1 = strtok((char*)0, "|"))
					{
					out2 = strtok((char*)0, "|");
					count = atoi(out2);
					prop = ((float)count / (float)tot_freq) ;
		       			printf("%s %d %1.2f\n", out1, count, prop);
					}
				}
		}
		else
		  printf("eatshow: %d: bad address index file\n", tail_address);

	/*============================================*/
	}
	rewind(fp1);
      }
   }
}
