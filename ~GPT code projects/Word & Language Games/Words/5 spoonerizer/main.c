// A minimal Win32 console app#include <stdio.h>#include <stdlib.h>#include <string.h>#define kMaxChars	48#define kNumWords	102100struct words{  char word[kMaxChars],pron[kMaxChars];}wordList[kNumWords],pronList[kNumWords]; int main( void ) {	long 		c,d,p,max,min,result, qresult, presult, lastDiff,wordc,pronc;	char 		str [255],word[255],pron[255],query[255],querypron[255],aux;	FILE		*pw,*wp;				wp = fopen("words pron.txt", "r");	if(wp == NULL)	{		printf("\nCannot open words pron.txt\n");		exit(0);	}		pw = fopen("pron words.txt", "r");	if(pw == NULL)	{		printf("\nCannot open pron words.txt\n");		exit(0);	}		c=0;		while(!feof(wp))	//	load the words	{		//	load the words		fgets(str,kMaxChars,wp);		//	get the entry		sscanf(str,"%s",&word);			//	get the word		sscanf(&str[strlen(word)],"%s",&pron);	//	get the pronunciation		strcpy(wordList[c].word,word);		strcpy(wordList[c].pron,pron);				//	load the pronunciations		fgets(str,kMaxChars,pw);		//	get the entry		sscanf(str,"%s",&pron);			//	get the pronunciation		sscanf(&str[strlen(pron)],"%s",&word);	//	get the word		strcpy(pronList[c].pron,pron);		strcpy(pronList[c].word,word);						//if(c%10000==0) printf("%s	%s		%s	%s\n",wordList[c].word,wordList[c].pron,pronList[c].pron,pronList[c].word);				c++;		if (c>=kNumWords) break;	}	printf("loaded\n");	if(wp != NULL)		fclose(wp);	if(pw != NULL)		fclose(pw);			//	generate word
	c=10111;	strcpy(query,wordList[c].word);		//	convert to upper	for(c=0;c<(strlen(query));c++){		if((query[c]>='a')&&(query[c]<='z')) query[c]-=32;	}	printf("searching for %s\n",query);		//	is the word in the word list?	min=0;	max=kNumWords;	c=(max-min)/2;	do{		lastDiff = min+((max-min)/2);		result = strcmp(query,wordList[c].word);		//printf("%s	%s	result %d	min %d	max %d	pointer %d\n",query,wordList[c].word,result,min,max,c);		if(result<0){			max=c;			c=min+((max-min)/2);		}else		if(result>0){			min=c;			c=min+((max-min)/2);		}	}while((result!=0)&&(c!=lastDiff));		if(result==0){
		printf("word found\n");
		wordc=c;
	} else printf("word not found\n");
	
	//find the pron
	c=0;	do{		c++;
		result = strcmp(wordList[wordc].pron,pronList[c].pron);
		//printf("%s	%s\n", wordList[wordc].pron,pronList[c].pron);			}while((result!=0)&&(c<=kNumWords));
	
	if(result==0){
		printf("pron found\n");
		pronc=c;
	} else printf("pron not found\n");

	//	copy the query pron
	strcpy(
		
	aux = pronList[pronc].pron[0];
	pronList[pronc].pron[0] = pronc[0]
	pronc = aux;
	
	result=-1;qresult=-1;presult=-1;
	c=0;
	
	return 0;}