/* Originally written by Mike Wilson -- January 1995            */
/* Modified the hard-coded pathnames -- Toria 20 March 96       */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_ENTRIES 10000

#define SRFILE  "/web/Eat/htdocs/sr.concise" /* file containing s-r data */
#define RSFILE  "/web/Eat/htdocs/rs.concise" /* file containing r-s data */
#define SRINDEX "/web/Eat/htdocs/sr.index"   /* s-r index file */
#define RSINDEX "/web/Eat/htdocs/rs.index"   /* r-s index file */

#define SRLENGTH 8211 /* number of headwords in s-r data */
#define RSLENGTH 22776 /* number of headwords in r-s data */
#define MAXBUF 100000 /*Maximum buffer size for words or association lists*/

typedef struct {
    char *name;
    char *val;
} entry;

char *makeword(char *line, char stop);
char *fmakeword(FILE *f, char stop, int *len);
char x2c(char *what);
void unescape_url(char *url);
void plustospace(char *str);

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

void find_assoc(cue, sourcef)
char sourcef, cue[25];
{
        FILE *fp, *fp1, *fopen();
        int i, j, k, fail=3, tot_rec, tot_freq, index_length, alnum=0, count;
        float prop;
        char c, response_word[MAXBUF],index_word[MAXBUF], *out1, *out2;
        long tail_address, ftell(), head_address;

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

                if (fseek(fp, tail_address, 0) != -1){
                       if (fgets (response_word, MAXBUF,fp)== NULL)                                             printf("eatshow: %d: bad address index file\n", tail_address);
                        else
                                {
                                printf("<p>");
                                printf("Number of different answers: %d\n", tot_rec);
                                printf("<p>");
                                printf("Total count of all answers: %d\n", tot_freq);
                                printf("<UL>");
                                out1 = strtok(response_word, "|");
                                out2 = strtok((char*)0, "|");
                                printf("<LI>");
                                count = atoi(out2);
                                prop = ((float)count / (float)tot_freq) ;
                                printf("%s \t \t %d  \t%1.2f", out1, count, prop);
                                while(out1 = strtok((char*)0, "|"))
                                        {
                                        out2 = strtok((char*)0, "|");
                                        count = atoi(out2);
                                        printf("<LI>");
                                        prop = ((float)count / (float)tot_freq) ;
                                        printf("%s \t \t %d \t %1.2f", out1, count, prop);
                                        }
                                printf("</UL>\n");
                                }
                }
                else
                  printf("eatshow: %d: bad address index file\n", tail_address);
        }
        rewind(fp1);
   }
}


main(int argc, char *argv[]) {
    entry entries[MAX_ENTRIES];
    register int x,m=0;
    int cl, i;
    char command[80];
        char cue[25];

    printf("Content-type: text/html%c%c",10,10);

    if(strcmp(getenv("REQUEST_METHOD"),"POST")) {
        printf("This script should be referenced with a METHOD of POST.\n");
        printf("If you don't understand this, see this ");
        printf("<A HREF=\"http://www.ncsa.uiuc.edu/SDG/Software/Mosaic/Docs/fill-out-forms/overview.html\">forms overview</A>.%c",10);
        exit(1);
    }
    if(strcmp(getenv("CONTENT_TYPE"),"application/x-www-form-urlencoded")) {
        printf("This script can only be used to decode form results. \n");
        exit(1);
    }
    cl = atoi(getenv("CONTENT_LENGTH"));

    for(x=0;cl && (!feof(stdin));x++) {
        m=x;
        entries[x].val = fmakeword(stdin,'&',&cl);
        plustospace(entries[x].val);
        unescape_url(entries[x].val);
        entries[x].name = makeword(entries[x].val,'=');
    }

    printf("<H1>EAT Word Associations </H1>");
    printf("<HR>");

    if(i = strlen(entries[0].val) != 0)
        {
         strcpy(cue, entries[0].val);
         printf("<H2>%s stimulated the following associations </H2>", cue);
         printf("<p>");
         find_assoc(cue, 's');
         printf("<HR>");
        }

    if(i = strlen(entries[1].val) != 0)
        {
            strcpy(cue, entries[1].val);
            printf("<H2>%s was the response to the following stimulli</H2>", cue);
            printf("<p>");
            find_assoc(cue, 'r');
            printf("<HR>");
        }


}
